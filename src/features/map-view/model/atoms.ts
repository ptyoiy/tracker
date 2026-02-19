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

export const isochroneAtom = atom<IsochroneState | null>(null);

export const viewportAtom = atom<ViewportBounds | null>(null);
