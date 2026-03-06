import { PREDICTION_CONFIG } from "@/shared/config/prediction";
import type { TransportMode } from "@/types/prediction";

/**
 * 가설 생성을 위한 Raw 평가 기준 데이터
 */
export interface HypothesisRawData {
  mode: TransportMode;
  avgSpeedKmh: number; // 도출된 평균 속도
  hasRoute: boolean; // TMAP 경로를 획득했는지 여부
  estimatedTimeSec: number; // TMAP 예상 소요시간 (초)
  actualTimeSec: number; // 실제 관측된 경과 시간 (초)
  hasTransitMatch: boolean; // 인근 대중교통 정류장 매칭 여부
}

/**
 * 가설들의 원시 점수를 계산하고 정규화된 확률로 반환합니다.
 */
export function calculateConfidenceScores(
  hypotheses: HypothesisRawData[],
): Map<string, number> {
  const rawScores = new Map<string, number>();
  let totalScore = 0;

  // 1. Raw Score 계산
  for (const h of hypotheses) {
    let score = 0;
    const config = PREDICTION_CONFIG.SPEED_RANGES[h.mode];

    // 속도 적합도 (Gaussian 분포 형태 모방)
    // 범위를 크게 벗어나면 0에 수렴, avg에 가까울수록 1.0에 가까움
    const deviation = Math.abs(h.avgSpeedKmh - config.avg);
    const range = (config.max - config.min) / 2;
    // deviation / range 가 0에 가까우면 1점, 1을 넘어가면 급감
    let speedScore = Math.max(
      0,
      1 - Math.pow(deviation / (range === 0 ? 1 : range), 2),
    );

    // 만약 범위를 완전히 벗어났더라도 최소한의 가능성을 남김 (0.1)
    if (h.avgSpeedKmh < config.min || h.avgSpeedKmh > config.max) {
      speedScore = speedScore > 0 ? speedScore : 0.1;
    }

    score += speedScore;

    // 경로 존재 여부 (0 or 1)
    if (h.hasRoute) {
      score += 1.0;
    }

    // ETA 오차 (0 ~ 1)
    if (h.estimatedTimeSec > 0 && h.actualTimeSec > 0) {
      const errorRatio =
        Math.abs(h.actualTimeSec - h.estimatedTimeSec) / h.estimatedTimeSec;

      // 오차비율이 ETA_TOLERANCE (30%) 이하이면 만점
      if (errorRatio <= PREDICTION_CONFIG.ETA_TOLERANCE) {
        score += 1.0;
      } else {
        // 허용치를 넘는 경우 선형 감소
        score += Math.max(
          0,
          1 - (errorRatio - PREDICTION_CONFIG.ETA_TOLERANCE),
        );
      }
    }

    // 대중교통 정류장 매칭 (보너스)
    if (h.mode === "transit" && h.hasTransitMatch) {
      score += 0.3;
    }

    // 최소 점수 보장
    if (score <= 0) score = 0.05;

    rawScores.set(h.mode, score);
    totalScore += score;
  }

  // 2. Normalize (합이 1이 되도록)
  const normalized = new Map<string, number>();

  if (totalScore > 0) {
    for (const [mode, rawScore] of Array.from(rawScores.entries())) {
      normalized.set(mode, rawScore / totalScore);
    }
  } else {
    // 모든 유효 점수가 0이면 균등 분배
    const equalProb = 1.0 / hypotheses.length;
    for (const h of hypotheses) {
      normalized.set(h.mode, equalProb);
    }
  }

  return normalized;
}
