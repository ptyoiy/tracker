import { atom } from "jotai";

export type IsochroneProfile = "walking" | "driving" | "cycling";

export type IsochroneState = {
  profile: IsochroneProfile;
  minutes: number;
  polygons: number[][][][]; // [polygon][ring][vertex][lng/lat]
  fallbackUsed: boolean;
  observationIndex: number;
};

export type ViewportBounds = {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
  center: { lat: number; lng: number };
  visualCenter: { lat: number; lng: number };
};

export type ActivePopup =
  | { type: "cctv"; id: string }
  | { type: "observation"; index: number }
  | null;

export type MapLayerVisibility = {
  cctv: boolean;
  isochrone: boolean;
  route: boolean;
  observations: boolean;
  transit: boolean;
};

export type IsochroneSelection = {
  profile: IsochroneProfile;
  minutes: number;
  observationIndex: number;
};

export const isochroneSelectionAtom = atom<IsochroneSelection>({
  profile: "walking",
  minutes: 10,
  observationIndex: 0,
});

export const viewportAtom = atom<ViewportBounds | null>(null);

export const activePopupAtom = atom<ActivePopup>(null);

export const mapLayersAtom = atom<MapLayerVisibility>({
  cctv: true,
  isochrone: true,
  route: true,
  observations: true,
  transit: true,
});
