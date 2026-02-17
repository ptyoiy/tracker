// src/config/constants.ts

// 지도 기본 값
export const DEFAULT_CENTER = {
  lat: 37.48879632053899,
  lng: 127.08430701903556,
};
export const DEFAULT_ZOOM = 7;

// Isochrone/속도 가정 (문서 기준)[file:1]
export const WALKING_SPEED_KMH = 5;
export const DRIVING_SPEED_KMH = 40;
export const CYCLING_SPEED_KMH = 15;

// 교통수단 분류 기준 (예: route-analysis에서 사용)[file:1]
// walking: ~6km/h, transit: ~6~15km/h, vehicle: 15~80km/h 등 문서 수치 참고 가능
export const SPEED_THRESHOLD = {
  WALKING_MAX: 6,
  TRANSIT_MAX: 15,
  VEHICLE_MAX: 80,
};

// API 관련
export const API_TIMEOUT_MS = 10_000;
export const API_RETRY_COUNT = 2;

// TMAP/Mapbox 기타 설정이 생기면 여기로
