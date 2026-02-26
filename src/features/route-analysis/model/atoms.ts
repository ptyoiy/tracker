// src/features/route-analysis/model/atoms.ts

import { atom } from "jotai";
import type { RouteInfo, SegmentAnalysis } from "@/types/analyze";

export type AnalysisResultState = {
  segments: SegmentAnalysis[] | null; // 실제 분석 결과
  observationsHash: string | null; // 이 결과를 만든 관측 세트의 해시
  stale: boolean; // 현재 관측과 불일치하면 true
};

export const analysisResultAtom = atom<AnalysisResultState>({
  segments: null,
  observationsHash: null,
  stale: false,
});

export const segmentAnalysesAtom = atom(
  (get) => get(analysisResultAtom).segments,
  (_get, set, segments: SegmentAnalysis[] | null) => {
    set(analysisResultAtom, (prev) => ({ ...prev, segments }));
  },
);

export const analyzeLoadingAtom = atom(false);
export const analyzeErrorAtom = atom<string | null>(null);

// 선택된 RouteInfo id 집합 (최대 3개)
export const selectedRouteIdsAtom = atom<Set<string>>(new Set<string>());

// 지도에 그릴 모든 RouteInfo 목록 (seg 합쳐서 평탄화된 배열)
export const allRouteInfosAtom = atom<RouteInfo[]>((get) => {
  const result = get(analysisResultAtom);
  if (!result.segments) return [];
  return result.segments.flatMap((s) => s.candidateRoutes ?? []);
});

// 선택된 RouteInfo만
export const selectedRouteInfosAtom = atom<RouteInfo[]>((get) => {
  const all = get(allRouteInfosAtom);
  const selected = get(selectedRouteIdsAtom);
  return all.filter((r) => selected.has(r.id));
});

// routeId별 CCTV 개수 매핑
export const routeCctvCountAtom = atom<Record<string, number>>({});
