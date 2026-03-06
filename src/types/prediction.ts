export type TransportMode = "walking" | "vehicle" | "transit";

export interface ConfidenceZone {
  high: GeoJSON.Polygon; // 60%+ 확률 영역
  medium: GeoJSON.Polygon; // 30~60% 확률 영역
  low: GeoJSON.Polygon; // 10~30% 확률 영역
}

export interface PredictionHypothesis {
  id: string; // 고유 식별자
  mode: TransportMode; // 교통수단
  probability: number; // 신뢰도 (0~1)
  currentPosition: {
    lat: number;
    lng: number;
  };
  confidenceZone: ConfidenceZone; // 확률 영역
  estimatedDestination?: {
    // 추정 목적지 (optional)
    id: string; // 목적지 고유 식별자
    lat: number;
    lng: number;
    name?: string;
    probability: number;
  };
  routeGeometry?: GeoJSON.LineString; // 예측 경로
  transitDetails?: {
    // 대중교통 전용
    lineId: string;
    lineName: string;
    fromStation: string;
    toStation: string;
    currentSegment: [number, number]; // [시작 정류장 idx, 끝 정류장 idx]
  };
  metadata: {
    avgSpeed: number; // 평균 속도 (km/h)
    lastObservedTime: string; // ISO 8601
    predictionTime: string; // ISO 8601
    elapsedMinutes: number; // 마지막 관측 이후 경과 시간
  };
}

export interface PredictionResult {
  hypotheses: PredictionHypothesis[]; // 확률 순 정렬
  timestamp: string; // 예측 생성 시각 (ISO 8601)
  inputObservations: Array<{
    lat: number;
    lng: number;
    timestamp: string;
    address?: string;
  }>;
  futureMinutes: number; // 현재 기준 +n분 예측 (단일 스냅샷 또는 최대값 등)
  status: "success" | "partial" | "error";
  warnings?: string[]; // API 실패, fallback 등
}

export interface KalmanState {
  position: [number, number]; // [lat, lng]
  velocity: [number, number]; // [vx, vy] m/s
  covariance: number[][]; // 4×4 공분산 행렬
  lastUpdateTime: string; // ISO 8601
  mode: TransportMode;
}
