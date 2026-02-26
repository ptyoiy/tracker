"use client";

import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { viewportAtom } from "@/features/map-view/model/atoms";
import {
  lastAnalysisParamsAtom,
  selectedRouteIdsAtom,
} from "@/features/route-analysis/model/atoms";
import { analyzeQueries } from "@/shared/api/queries";
import {
  allCctvAtom,
  cctvSearchCenterAtom,
  manualSearchCctvAtom,
} from "../model/atoms";
import { filterCctvByContext } from "./buffer-filter";

export function useFilteredCctv() {
  const allCctv = useAtomValue(allCctvAtom);
  const viewport = useAtomValue(viewportAtom);
  const lastParams = useAtomValue(lastAnalysisParamsAtom);
  const selectedRouteIds = useAtomValue(selectedRouteIdsAtom);
  const manualSearchCctv = useAtomValue(manualSearchCctvAtom);
  const searchCenter = useAtomValue(cctvSearchCenterAtom);

  const { data: analysisData } = useQuery(
    analyzeQueries.segments(
      lastParams?.observations,
      lastParams?.futureMinutes,
    ),
  );

  const routeCctv = useMemo(() => {
    if (!analysisData || !allCctv.length || selectedRouteIds.size === 0)
      return [];

    const allRoutes = analysisData.segments.flatMap((s) => s.candidateRoutes);
    const selectedRoutes = allRoutes.filter((r) => selectedRouteIds.has(r.id));

    if (selectedRoutes.length === 0) return [];

    const polyline = selectedRoutes
      .flatMap((route) => route.legs.flatMap((leg) => leg.polyline))
      .map((p) => [p.lng, p.lat] as [number, number]);

    let candidates = filterCctvByContext(allCctv, {
      type: "ROUTE",
      polyline,
      bufferMeters: 100,
    });

    if (viewport) {
      const { sw, ne } = viewport;
      const BUFFER = 0.00225;
      candidates = filterCctvByContext(candidates, {
        type: "VIEWPORT",
        bounds: {
          sw: [sw.lng - BUFFER, sw.lat - BUFFER],
          ne: [ne.lng + BUFFER, ne.lat + BUFFER],
        },
      });
    }

    return candidates;
  }, [analysisData, allCctv, selectedRouteIds, viewport]);

  return useMemo(() => {
    if (manualSearchCctv.length > 0 || searchCenter) {
      return manualSearchCctv;
    }
    return routeCctv;
  }, [manualSearchCctv, searchCenter, routeCctv]);
}
