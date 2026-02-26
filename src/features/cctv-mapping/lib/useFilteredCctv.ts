"use client";

import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { viewportAtom } from "@/features/map-view/model/atoms";
import {
  lastAnalysisParamsAtom,
  selectedRouteIdsAtom,
} from "@/features/route-analysis/model/atoms";
import { analyzeQueries, cctvQueries } from "@/shared/api/queries";
import {
  allCctvAtom,
  cctvSearchCenterAtom,
  cctvSearchRadiusAtom,
} from "../model/atoms";
import { filterCctvByContext } from "./buffer-filter";

export function useFilteredCctv() {
  const allCctv = useAtomValue(allCctvAtom);
  const viewport = useAtomValue(viewportAtom);
  const lastParams = useAtomValue(lastAnalysisParamsAtom);
  const selectedRouteIds = useAtomValue(selectedRouteIdsAtom);
  const searchCenter = useAtomValue(cctvSearchCenterAtom);
  const searchRadius = useAtomValue(cctvSearchRadiusAtom);

  // 1. 경로 분석 데이터 가져오기
  const { data: analysisData } = useQuery(
    analyzeQueries.segments(
      lastParams?.observations,
      lastParams?.futureMinutes,
    ),
  );

  // 2. 수동 검색 결과 (React Query)
  const { data: manualSearchCctvs = [] } = useQuery(
    cctvQueries.nearby(
      searchCenter?.lat ?? 0,
      searchCenter?.lng ?? 0,
      searchRadius,
    ),
  );

  // 3. 선택된 경로 정보 계산
  const selectedRoutes = useMemo(() => {
    if (!analysisData || selectedRouteIds.size === 0) return [];
    const allRoutes = analysisData.segments.flatMap((s) => s.candidateRoutes);
    return allRoutes.filter((r) => selectedRouteIds.has(r.id));
  }, [analysisData, selectedRouteIds]);

  // 4. 경로 주변 CCTV 필터링 (메모리에 있는 전체 데이터 + 서버에서 가져올 데이터의 조합)
  // 현재는 메모리(allCctv)에 있는 것을 경로 기준으로 필터링
  const routeCctv = useMemo(() => {
    if (selectedRoutes.length === 0 || !allCctv.length) return [];

    const polyline = selectedRoutes
      .flatMap((route) => route.legs.flatMap((leg) => leg.polyline))
      .map((p) => [p.lng, p.lat] as [number, number]);

    let candidates = filterCctvByContext(allCctv, {
      type: "ROUTE",
      polyline,
      bufferMeters: 100,
    });

    // 뷰포트 필터링은 성능을 위해 유지하되, 너무 빡빡하지 않게 적용
    if (viewport) {
      const { sw, ne } = viewport;
      const BUFFER = 0.01; // 약 1km 정도의 넉넉한 버퍼
      candidates = filterCctvByContext(candidates, {
        type: "VIEWPORT",
        bounds: {
          sw: [sw.lng - BUFFER, sw.lat - BUFFER],
          ne: [ne.lng + BUFFER, ne.lat + BUFFER],
        },
      });
    }

    return candidates;
  }, [selectedRoutes, allCctv, viewport]);

  // 최종 결과 반환 (수동 검색 중이면 수동 검색 결과를, 아니면 경로 주변 결과를)
  return useMemo(() => {
    if (searchCenter) {
      return manualSearchCctvs;
    }
    return routeCctv;
  }, [searchCenter, manualSearchCctvs, routeCctv]);
}
