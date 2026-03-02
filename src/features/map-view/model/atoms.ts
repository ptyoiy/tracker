import type { CCTV } from "@/types/cctv";
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

// 별도로 참조 — 순환 의존 방지를 위해 여기서 직접 선언
export const allCctvForPurposeAtom = atom<CCTV[]>([]);

// CCTV 설치 목적 고유 목록 (동적으로 데이터에서 추출)
export const cctvPurposesAtom = atom((get) => {
  const all = get(allCctvForPurposeAtom);
  const purposes = new Set<string>(all.map((c) => c.purpose).filter(Boolean));
  return Array.from(purposes).sort();
});

// 숨길 CCTV 목적 Set (빈 Set = 모두 표시)
export const cctvPurposeFilterAtom = atom(new Set<string>());
