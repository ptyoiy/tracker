// src/features/transit-lookup/lib/useNearbyStations.ts
"use client";

import { observationsAtom } from "@/features/observation-input/model/atoms";
import { apiClient } from "@/shared/api/client";
import { useQueries } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo } from "react";
import {
  type NearbyStationMarker,
  nearbyStationsAtom,
} from "../model/atoms";
import type { TransitNearbyResponse } from "../model/types";

/**
 * 등록된 관측지점들의 인근 정류장 위치를 자동으로 조회하는 hook.
 * 결과는 nearbyStationsAtom에 저장되어 지도 마커 표시에 사용됩니다.
 * 20초 갱신과 무관하게 관측지점 좌표를 키로 캐싱합니다.
 */
export function useNearbyStations() {
  const observations = useAtomValue(observationsAtom);
  const setNearbyStations = useSetAtom(nearbyStationsAtom);

  // 유효한 관측지점만 필터링 (좌표가 존재하는)
  const validObservations = useMemo(
    () =>
      observations
        .map((obs, idx) => ({ ...obs, originalIndex: idx }))
        .filter((obs) => obs.lat && obs.lng),
    [observations],
  );

  const queries = useQueries({
    queries: validObservations.map((obs) => ({
      queryKey: [
        "nearby-stations",
        obs.lat.toFixed(4),
        obs.lng.toFixed(4),
      ],
      queryFn: async () => {
        const body = {
          lat: obs.lat,
          lng: obs.lng,
          referenceTime: new Date().toISOString(),
        };
        return apiClient
          .post("transit-nearby", { json: body })
          .json<TransitNearbyResponse>();
      },
      // 관측지점 좌표가 바뀌지 않는 한 캐시 유지 (5분)
      staleTime: 5 * 60 * 1000,
      // 재시도 1회만
      retry: 1,
    })),
  });

  // 쿼리 결과를 NearbyStationMarker[]로 변환하여 atom에 저장
  useEffect(() => {
    const markers: NearbyStationMarker[] = [];
    const seen = new Set<string>(); // 중복 방지

    console.log("[DEBUG:useNearbyStations] queries:", queries.length, "개, 상태:", queries.map((q, i) => `[${i}] loading=${q.isLoading} error=${!!q.error} data=${!!q.data} busCount=${q.data?.bus.stations.length ?? '-'}`).join(', '));

    for (let i = 0; i < queries.length; i++) {
      const result = queries[i];
      const obsIndex = validObservations[i]?.originalIndex ?? i;

      if (!result.data) continue;
      console.log(
        "[DEBUG:useNearbyStations] result.data:",
        result.data.bus.stations);
      // 버스 정류장
      for (const station of result.data.bus.stations) {
        const key = `bus-${station.stationId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        markers.push({
          lat: station.lat,
          lng: station.lng,
          name: station.stationName,
          type: "bus",
          stationId: station.stationId,
          distance: station.distance,
          observationIndex: obsIndex,
        });
      }

      // 지하철역
      for (const station of result.data.subway.stations) {
        const key = `subway-${station.stationCode}`;
        if (seen.has(key)) continue;
        seen.add(key);
        markers.push({
          lat: station.lat,
          lng: station.lng,
          name: station.stationName,
          type: "subway",
          stationId: station.stationCode,
          distance: station.distance,
          observationIndex: obsIndex,
        });
      }
    }

    setNearbyStations(markers);
  }, [queries, validObservations, setNearbyStations]);

  const isLoading = queries.some((q) => q.isLoading);

  return { isLoading };
}
