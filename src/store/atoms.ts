// src/store/atoms.ts
import { atom } from "jotai";
import type { TmapDrivingResponse } from "@/lib/tmap/driving";
import type { AnalyzeResponse, Observation } from "@/types/analyze";

export const observationsAtom = atom<Observation[]>([]);
export const analysisResultAtom = atom<AnalyzeResponse | null>(null);
export const isochroneDataAtom = atom<TmapDrivingResponse | null>(null);
export const isLoadingAtom = atom(false);
export const activeTabAtom = atom<string>("input");
export const futureMinutesAtom = atom<number>(10);
