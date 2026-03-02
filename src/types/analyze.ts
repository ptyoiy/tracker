import type { TmapTransitRoute } from "@/shared/api/tmap/transit";
import type { Observation } from "./observation";

// 분석 요청/응답 (route-analysis API)
export type TransportMode = "walking" | "transit" | "vehicle";
export type RouteLegMode =
  | "WALK"
  | "BUS"
  | "SUBWAY"
  | "CAR"
  | "TRAIN"
  | "EXPRESSBUS";

export type RouteLeg = {
  mode: RouteLegMode;
  distanceKm: number;
  durationSeconds: number;
  polyline: { lat: number; lng: number }[];
  route?: string; // 버스 번호, 지하철 노선 등
};

export type RouteInfo = {
  id: string;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  legs: RouteLeg[];
  primaryMode: TransportMode;
  isReasonable: boolean; // 실제 경과 시간과의 유사성 여부
};

export type RouteGroup = {
  id: string; // 예: "bus_group_1"
  busNumbers: string[]; // ["4312", "4313"]
  memberRouteIds: string[]; // 이 그룹에 속한 RouteInfo.id 목록
  commonPolyline: { lat: number; lng: number }[]; // 공통 구간 좌표
  durationRange: [number, number]; // [최소소요시간, 최대소요시간]
};

export type SegmentAnalysis = {
  id: string; // 예: "0-1"
  fromIndex: number;
  toIndex: number;
  from: Observation;
  to: Observation;
  distanceKm: number;
  durationSeconds: number;
  averageSpeedKmh: number;
  inferredMode: TransportMode;
  candidateRoutes: RouteInfo[]; // TMAP 경로 후보 (초기엔 빈 배열)
  transits: TmapTransitRoute[]; // 대중교통 경로 (여러 개일 수 있음)
  overlapGroups?: RouteGroup[]; // 신규 추가
};

export type AnalyzeRequest = {
  observations: Observation[];
  futureMinutes: number;
};

export type AnalyzeResponse = {
  segments: SegmentAnalysis[];
  fallbackUsed?: boolean;
  errors: string | null;
};
