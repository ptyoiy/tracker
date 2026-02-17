export type LatLng = {
  lat: number;
  lng: number;
};

export type IsoDateTimeString = string; // e.g. "2026-02-17T08:00:00+09:00"

// 공통 API 에러 타입
export type ApiError = {
  code: string; // e.g. 'TMAP_429', 'MAPBOX_ERROR'
  message: string;
  details?: unknown;
};
