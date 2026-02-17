// src/types/cctv.ts
import type { LatLng } from "./common";

// CCTV 메타데이터
export type CCTVDirection =
  | "N"
  | "S"
  | "E"
  | "W"
  | "NE"
  | "NW"
  | "SE"
  | "SW"
  | "UNKNOWN";

export type CCTVInfo = LatLng & {
  id: string;
  name?: string;
  direction?: CCTVDirection;
  agency?: string; // 관제 주체
  roadName?: string;
};
