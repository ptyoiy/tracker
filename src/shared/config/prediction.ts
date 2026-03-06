export const PREDICTION_CONFIG = {
  // 확률 계산
  SPEED_RANGES: {
    walking: { min: 3, max: 7, avg: 5 },
    vehicle: { min: 15, max: 50, avg: 30 },
    transit: { min: 20, max: 60, avg: 35 },
  },
  ETA_TOLERANCE: 0.3, // ±30%
  TRANSIT_RADIUS: 100, // 정류장 매칭 반경 (m)

  // 제한값
  MAX_HYPOTHESES: 5,
  MAX_FUTURE_MINUTES: 20,
  MIN_OBSERVATIONS: 2,
  MAX_OBSERVATIONS: 7,

  // 불확실성 증가율 (m/min)
  UNCERTAINTY_GROWTH: {
    walking: 40,
    vehicle: 200,
    transit: 100,
  },

  // 캐싱
  CACHE_TTL: 60, // seconds

  // 애니메이션 (timeline-playback 연동)
  TIMELINE_FPS: 60,
  PLAYBACK_SPEED: 2, // 2초당 1분 (배속)

  // API 호출
  MAX_TMAP_CALLS: 9,
  TMAP_TIMEOUT: 5000, // ms
  MAPBOX_TIMEOUT: 3000, // ms
} as const;
