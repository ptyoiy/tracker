import { atom } from "jotai";

export type IsochroneProfile = "walking" | "driving" | "cycling";

export type IsochroneState = {
  profile: IsochroneProfile;
  minutes: number;
  polygons: number[][][][]; // [polygon][ring][vertex][lng/lat]
  fallbackUsed: boolean;
};

export type ViewportBounds = {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
};

export type ActivePopup =
  | { type: "cctv"; id: string }
  | { type: "observation"; index: number }
  | null;

export const isochroneAtom = atom<IsochroneState | null>(null);

export const viewportAtom = atom<ViewportBounds | null>(null);

export const activePopupAtom = atom<ActivePopup>(null);
