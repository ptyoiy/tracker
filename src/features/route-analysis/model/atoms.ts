import type { SegmentAnalysis } from "@/types/analyze";
import { atom } from "jotai";

export const segmentAnalysesAtom = atom<SegmentAnalysis[] | null>(null);

export const analyzeLoadingAtom = atom(false);

export const analyzeErrorAtom = atom<string | null>(null);
