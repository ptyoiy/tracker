"use client";

import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { analyzeQueries } from "@/shared/api/queries";
import { lastAnalysisParamsAtom, selectedRouteIdsAtom } from "../model/atoms";

export function useSelectedRoutes() {
  const lastParams = useAtomValue(lastAnalysisParamsAtom);
  const selectedRouteIds = useAtomValue(selectedRouteIdsAtom);

  const { data: analysisData } = useQuery(
    analyzeQueries.segments(
      lastParams?.observations,
      lastParams?.futureMinutes,
    ),
  );

  return useMemo(() => {
    if (!analysisData) return [];

    const allRoutes = analysisData.segments.flatMap((s) => s.candidateRoutes);
    return allRoutes.filter((r) => selectedRouteIds.has(r.id));
  }, [analysisData, selectedRouteIds]);
}
