import { atom } from "jotai";
import type { SegmentAnalysis } from "@/types/analyze";

export const segmentAnalysesAtom = atom<SegmentAnalysis[] | null>(null);

export const analyzeLoadingAtom = atom(false);

export const analyzeErrorAtom = atom<string | null>(null);
