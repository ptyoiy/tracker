import { PredictionResult } from '@/types/prediction';
import { atom } from 'jotai';

export type PredictionUIState = 'idle' | 'analyzing' | 'predicting' | 'predicted' | 'error';

// 메인 상태
export const predictionStateAtom = atom<PredictionUIState>('idle');

// 예측 결과
export const predictionResultAtom = atom<PredictionResult | null>(null);

// 부분 선택 (레이어 필터용)
export const selectedHypothesisIdAtom = atom<string | null>(null);

// 미래 타임라인 관련
export const futureMinutesAtom = atom<number>(5);
export const isPlayingTimelineAtom = atom<boolean>(false);

// 발생한 에러 기록
export const predictionErrorAtom = atom<Error | null>(null);
