import { atom } from "jotai";
import type { TransitNearbyResponse } from "./types";

// 위치 정보 (선택된 좌표)
export const transitLocationAtom = atom<{ lat: number; lng: number } | null>(
  null,
);

// 기준 시각 (ISO 8601) - null인 경우 '현재 시각' 의미
export const transitReferenceTimeAtom = atom<string | null>(null);

// 사용자 선택 모드 (auto: 자동 판별)
export const transitSelectedModeAtom = atom<"auto" | "realtime" | "timetable">(
  "auto",
);

// API 결과 데이터
export const transitResultAtom = atom<TransitNearbyResponse | null>(null);

// 로딩 및 에러 상태
export const transitLoadingAtom = atom<boolean>(false);
export const transitErrorAtom = atom<string | null>(null);

// 관측지점 기반 인근 정류장 (마커 표시 전용)
export type NearbyStationMarker = {
  lat: number;
  lng: number;
  name: string;
  type: "bus" | "subway";
  stationId: string;
  distance: number;
  observationIndex: number;
};

export const nearbyStationsAtom = atom<NearbyStationMarker[]>([]);

// 선택된 노선의 경로 좌표 (지도 폴리라인 표시용)
export type RoutePathStop = {
  lat: number;
  lng: number;
  stationName: string;
  cumulativeMinutes: number;
  isTransfer: boolean;
  isFirst: boolean;
};

export type SelectedRoutePath = {
  routeName: string;
  type: "bus" | "subway";
  path: { lat: number; lng: number }[];
  stops: RoutePathStop[];
} | null;

export const selectedRoutePathAtom = atom<SelectedRoutePath>(null);
