// src/features/route-analysis/model/atoms.ts

import { atom } from "jotai";
import type { Observation } from "@/types/observation";

export const lastAnalysisParamsAtom = atom<{
  observations: Observation[];
  futureMinutes: number;
} | null>(null);

export const analysisResultAtom = atom<{
  observationsHash: string | null;
  stale: boolean;
}>({
  observationsHash: null,
  stale: false,
});

// 선택된 RouteInfo id 집합 (최대 3개)
export const selectedRouteIdsAtom = atom<Set<string>>(new Set<string>());

// routeId별 CCTV 개수 매핑
export const routeCctvCountAtom = atom<Record<string, number>>({});
