import { PREDICTION_CONFIG } from "@/shared/config/prediction";
import type { KalmanState, TransportMode } from "@/types/prediction";

/**
 * 간단한 2D 등거리 원통 도법 (Equirectangular projection)을 사용하여
 * 위경도를 미터 단위 평면 좌표계로 변환합니다.
 */
class LocalProjector {
  private lat0: number;
  private lng0: number;
  private cosLat0: number;

  private readonly R_EARTH = 6371000; // 지구 반지름 (m)

  constructor(originLat: number, originLng: number) {
    this.lat0 = originLat;
    this.lng0 = originLng;
    this.cosLat0 = Math.cos((originLat * Math.PI) / 180);
  }

  toLocal(lat: number, lng: number): [number, number] {
    const x = (lng - this.lng0) * (Math.PI / 180) * this.R_EARTH * this.cosLat0;
    const y = (lat - this.lat0) * (Math.PI / 180) * this.R_EARTH;
    return [x, y];
  }

  toGlobal(x: number, y: number): [number, number] {
    const lat = this.lat0 + (y / this.R_EARTH) * (180 / Math.PI);
    const lng =
      this.lng0 + (x / (this.R_EARTH * this.cosLat0)) * (180 / Math.PI);
    return [lat, lng];
  }
}

/**
 * 2D 선형 칼만 필터 (Constant Velocity Model)
 */
export class KalmanEstimator {
  private projector: LocalProjector | null = null;

  // State vector: [x, y, vx, vy]
  private X: [number, number, number, number] = [0, 0, 0, 0];

  // Covariance matrix (4x4)
  private P: number[][] = [
    [100, 0, 0, 0],
    [0, 100, 0, 0],
    [0, 0, 25, 0],
    [0, 0, 0, 25],
  ];

  private lastTimeMs: number = 0;
  private mode: TransportMode = "walking";

  // Process noise variance (가속도 노이즈)
  private get Q_var() {
    return this.mode === "walking" ? 0.05 : this.mode === "vehicle" ? 0.3 : 0.1;
  }

  // Measurement noise variance (GPS 오차)
  private readonly R_var = 10; // 10m 위치 오차

  constructor(mode: TransportMode = "walking") {
    this.mode = mode;
  }

  /**
   * 행렬 덧셈
   */
  private addMatrix(A: number[][], B: number[][]): number[][] {
    return A.map((row, i) => row.map((val, j) => val + B[i][j]));
  }

  /**
   * 관측치를 받아 상태를 업데이트합니다.
   * 첫 관측치인 경우 필터를 초기화합니다.
   */
  public update(lat: number, lng: number, timestampIso: string) {
    const timeMs = new Date(timestampIso).getTime();

    if (!this.projector) {
      // 초기화
      this.projector = new LocalProjector(lat, lng);
      this.lastTimeMs = timeMs;
      this.X = [0, 0, 0, 0];
      return;
    }

    const dt = (timeMs - this.lastTimeMs) / 1000.0; // seconds
    if (dt <= 0) return; // 동일 시간이거나 과거 값이면 무시

    const [measX, measY] = this.projector.toLocal(lat, lng);

    // --- 1. Predict ---
    // State transition function (F)
    const F = [
      [1, 0, dt, 0],
      [0, 1, 0, dt],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];

    // X_pred = F * X
    const xPred = this.X[0] + this.X[2] * dt;
    const yPred = this.X[1] + this.X[3] * dt;
    const vxPred = this.X[2];
    const vyPred = this.X[3];

    // Q (Process noise covariance)
    const qV = this.Q_var;
    const dt2 = dt * dt;
    const dt3 = (dt2 * dt) / 2;
    const dt4 = (dt2 * dt2) / 4;
    const Q = [
      [dt4 * qV, 0, dt3 * qV, 0],
      [0, dt4 * qV, 0, dt3 * qV],
      [dt3 * qV, 0, dt2 * qV, 0],
      [0, dt3 * qV, 0, dt2 * qV],
    ];

    // P_pred = F * P * F^T + Q
    // (F * P * F^T) 직접 계산
    const P_pred: number[][] = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          for (let l = 0; l < 4; l++) {
            sum += F[i][k] * this.P[k][l] * F[j][l];
          }
        }
        P_pred[i][j] = sum + Q[i][j];
      }
    }

    // --- 2. Update ---
    // Measurement matrix H = [1 0 0 0; 0 1 0 0] (x, y 측정)
    // Residual y = Z - H * X_pred
    const yResX = measX - xPred;
    const yResY = measY - yPred;

    // S = H * P_pred * H^T + R
    const S = [
      [P_pred[0][0] + this.R_var, P_pred[0][1]],
      [P_pred[1][0], P_pred[1][1] + this.R_var],
    ];

    // S inverse
    const detS = S[0][0] * S[1][1] - S[0][1] * S[1][0];
    const invS = [
      [S[1][1] / detS, -S[0][1] / detS],
      [-S[1][0] / detS, S[0][0] / detS],
    ];

    // Kalman Gain K = P_pred * H^T * invS
    // H^T * invS is 4x2
    const temp = [
      [invS[0][0], invS[0][1]],
      [invS[1][0], invS[1][1]],
      [0, 0],
      [0, 0],
    ];
    const K: number[][] = [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 2; j++) {
        K[i][j] = P_pred[i][0] * temp[0][j] + P_pred[i][1] * temp[1][j];
      }
    }

    // X = X_pred + K * yRes
    this.X[0] = xPred + K[0][0] * yResX + K[0][1] * yResY;
    this.X[1] = yPred + K[1][0] * yResX + K[1][1] * yResY;
    this.X[2] = vxPred + K[2][0] * yResX + K[2][1] * yResY;
    this.X[3] = vyPred + K[3][0] * yResX + K[3][1] * yResY;

    // P = (I - K * H) * P_pred
    // (I - K * H) 계산
    const I_KH = [
      [1 - K[0][0], -K[0][1], 0, 0],
      [-K[1][0], 1 - K[1][1], 0, 0],
      [-K[2][0], -K[2][1], 1, 0],
      [-K[3][0], -K[3][1], 0, 1],
    ];

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          sum += I_KH[i][k] * P_pred[k][j];
        }
        this.P[i][j] = sum;
      }
    }

    this.lastTimeMs = timeMs;
  }

  /**
   * 학습된 상태를 바탕으로 기준 timestamp 미래의 위치를 예측합니다.
   * 실제로는 TMAP 경로 등 네트워크 제약을 쓰지만, 1차적으로 직선 기반 예측을 제공합니다.
   */
  public predictFuture(targetTimeIso: string): {
    position: [number, number];
    covariance: number[][];
  } {
    if (!this.projector) {
      throw new Error("Kalman filter not initialized");
    }

    const timeMs = new Date(targetTimeIso).getTime();
    const dt = Math.max(0, (timeMs - this.lastTimeMs) / 1000.0);

    const xPred = this.X[0] + this.X[2] * dt;
    const yPred = this.X[1] + this.X[3] * dt;

    // 예측 불확실성 (간단하게 시간에 비례해 공분산 증가)
    const growth = (dt / 60) * PREDICTION_CONFIG.UNCERTAINTY_GROWTH[this.mode];
    const P_pred: number[][] = this.P.map((r) => [...r]);
    P_pred[0][0] += growth * growth;
    P_pred[1][1] += growth * growth;

    const [predLat, predLng] = this.projector.toGlobal(xPred, yPred);
    return {
      position: [predLat, predLng],
      covariance: P_pred,
    };
  }

  public getState(): KalmanState {
    if (!this.projector) {
      throw new Error("Kalman filter not initialized");
    }
    const [lat, lng] = this.projector.toGlobal(this.X[0], this.X[1]);
    return {
      position: [lat, lng],
      velocity: [this.X[2], this.X[3]],
      covariance: this.P,
      lastUpdateTime: new Date(this.lastTimeMs).toISOString(),
      mode: this.mode,
    };
  }
}
