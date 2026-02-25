import { atom } from "jotai";
import type { TmapTransitRoute } from "@/shared/api/tmap/transit";

export const transitLookupStartAtom = atom<{ lat: number; lng: number } | null>(
  null,
);
export const transitLookupEndAtom = atom<{ lat: number; lng: number } | null>(
  null,
);
export const transitLookupTimeAtom = atom<string>(
  new Date().toISOString().slice(0, 16),
); // YYYY-MM-DDTHH:mm
export const transitLookupResultAtom = atom<TmapTransitRoute | null>(null);
export const transitLookupLoadingAtom = atom<boolean>(false);
export const transitLookupPickingAtom = atom<"start" | "end" | null>(null);
