// src/types/analyze.ts
import type { LatLng } from "./common";
import type { Observation } from "./observation";

// 분석 요청/응답 (route-analysis API)
export type TransportMode = "walking" | "transit" | "vehicle";

export type AnalyzeRequest = {
  observations: Observation[]; // min 2, max 7
  futureMinutes: number; // 1~60
};

// 멀티모달 경로 정보 (TMAP 응답 가공)
export type RouteLegMode = "WALK" | "BUS" | "SUBWAY" | "CAR";

export type RouteLeg = {
  mode: RouteLegMode;
  distanceKm: number;
  durationSeconds: number;
  polyline: LatLng[]; // 디코딩된 경로 좌표
};

export type RouteInfo = {
  id: string;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  legs: RouteLeg[];
  primaryMode: TransportMode; // walking/transit/vehicle
};

// 구간별 분석 결과
export type SegmentAnalysis = {
  id: string; // `${fromIndex}-${toIndex}` 등
  from: Observation;
  to: Observation;
  distanceKm: number;
  durationSeconds: number;
  averageSpeedKmh: number;
  inferredMode: TransportMode;
  // TMAP 기반 후보 경로 요약
  routes: RouteInfo[];
};

export type AnalyzeResponse = {
  segments: SegmentAnalysis[];
  fallbackUsed?: boolean;
  errors?: string;
};
