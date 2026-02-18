import { atom } from "jotai";

export type IsochroneProfile = "walking" | "driving" | "cycling";

export type IsochroneState = {
  profile: IsochroneProfile;
  minutes: number;
  polygons: number[][][][]; // [polygon][ring][vertex][lng/lat]
  fallbackUsed: boolean;
};

export const isochroneAtom = atom<IsochroneState | null>(null);
