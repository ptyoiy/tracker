// src/features/route-analysis/model/atoms.ts

import { atom } from "jotai";
import type { RouteInfo, SegmentAnalysis } from "@/types/analyze";

export const segmentAnalysesAtom = atom<SegmentAnalysis[] | null>(null);
export const analyzeLoadingAtom = atom(false);
export const analyzeErrorAtom = atom<string | null>(null);

// 선택된 RouteInfo id 집합 (최대 3개)
export const selectedRouteIdsAtom = atom<Set<string>>(new Set<string>());

// 지도에 그릴 모든 RouteInfo 목록 (seg 합쳐서 평탄화된 배열)
export const allRouteInfosAtom = atom<RouteInfo[]>((get) => {
  const segments = get(segmentAnalysesAtom);
  if (!segments) return [];
  return segments.flatMap((s) => s.candidateRoutes ?? []);
});

// 선택된 RouteInfo만
export const selectedRouteInfosAtom = atom<RouteInfo[]>((get) => {
  const all = get(allRouteInfosAtom);
  const selected = get(selectedRouteIdsAtom);
  return all.filter((r) => selected.has(r.id));
});

// routeId별 CCTV 개수 매핑
export const routeCctvCountAtom = atom<Record<string, number>>({});
