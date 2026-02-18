import { atom } from "jotai";
import type { SegmentAnalysis } from "@/types/analyze";

export const segmentAnalysesAtom = atom<SegmentAnalysis[] | null>(null);
export const analyzeLoadingAtom = atom(false);
export const analyzeErrorAtom = atom<string | null>(null);

// 최대 3개의 RouteInfo id를 선택
export const selectedRouteIdsAtom = atom<Set<string>>(new Set<string>());
