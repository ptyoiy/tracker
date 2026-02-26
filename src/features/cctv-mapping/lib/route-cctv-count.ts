// src/features/cctv-mapping/lib/route-cctv-count.ts
"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { useAnalyzeQuery } from "@/features/observation-input/lib/useAnalyzeQuery";
import {
  lastAnalysisParamsAtom,
  routeCctvCountAtom,
} from "@/features/route-analysis/model/atoms";
import { allCctvAtom } from "../model/atoms";
import { filterCctvByContext } from "./buffer-filter";

export function useComputeRouteCctvCount() {
  const allCctv = useAtomValue(allCctvAtom);
  const lastParams = useAtomValue(lastAnalysisParamsAtom);
  const setCounts = useSetAtom(routeCctvCountAtom);

  const { data: analysisData } = useAnalyzeQuery(
    lastParams?.observations,
    lastParams?.futureMinutes,
  );

  const allRoutes = useMemo(() => {
    return analysisData?.segments.flatMap((s) => s.candidateRoutes) ?? [];
  }, [analysisData]);

  useEffect(() => {
    if (!allCctv.length || !allRoutes.length) {
      setCounts({});
      return;
    }

    const next: Record<string, number> = {};

    for (const route of allRoutes) {
      const polyline = route.legs
        .flatMap((leg) => leg.polyline)
        .map((p) => [p.lng, p.lat] as [number, number]);

      const nearCctvs = filterCctvByContext(allCctv, {
        type: "ROUTE",
        polyline,
        bufferMeters: 100,
      });

      next[route.id] = nearCctvs.length;
    }

    setCounts(next);
  }, [allCctv, allRoutes, setCounts]);
}
