// src/features/map-view/lib/useIsochrone.ts
"use client";

import { useAtom, useAtomValue } from "jotai";
import { useCallback } from "react";
import {
  futureMinutesAtom,
  observationsAtom,
} from "@/features/observation-input/model/atoms";
import {
  type IsochroneProfile,
  isochroneAtom,
  isochroneCacheAtom,
} from "../model/atoms";

type IsochroneApiResponse = {
  polygons: { coordinates: number[][][] }[];
  fallbackUsed: boolean;
  errors: string | null;
};

export function useIsochrone() {
  const [isochrone, setIsochrone] = useAtom(isochroneAtom);
  const [cache, setCache] = useAtom(isochroneCacheAtom);
  const observations = useAtomValue(observationsAtom);
  const [futureMinutes, setFutureMinutes] = useAtom(futureMinutesAtom);

  const computeIsochrone = useCallback(
    async (profile: IsochroneProfile, index?: number) => {
      if (observations.length === 0) return;

      const targetIndex =
        index ?? isochrone?.observationIndex ?? observations.length - 1;
      const target = observations[targetIndex];

      if (!target) return;

      // 캐시 키 생성 (좌표는 소수점 6자리까지 제한하여 미세한 차이로 인한 캐시 미스 방지)
      const cacheKey = `${target.lat.toFixed(6)},${target.lng.toFixed(6)},${futureMinutes},${profile}`;

      if (cache[cacheKey]) {
        setIsochrone({
          ...cache[cacheKey],
          observationIndex: targetIndex,
        });
        return;
      }

      const body = {
        lat: target.lat,
        lng: target.lng,
        minutes: futureMinutes,
        profile,
      };

      const res = await fetch("/api/isochrone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as IsochroneApiResponse;

      const newState = {
        profile,
        minutes: futureMinutes,
        polygons: res.ok ? data.polygons.map((p) => p.coordinates) : [],
        fallbackUsed: !res.ok || data.fallbackUsed,
        observationIndex: targetIndex,
      };

      // 성공/실패 여부와 관계없이 결과를 캐시에 저장 (반복적인 실패 요청 방지)
      setCache((prev) => ({ ...prev, [cacheKey]: newState }));
      setIsochrone(newState);
    },
    [
      observations,
      futureMinutes,
      setIsochrone,
      isochrone?.observationIndex,
      cache,
      setCache,
    ],
  );

  return { isochrone, computeIsochrone, futureMinutes, setFutureMinutes };
}
