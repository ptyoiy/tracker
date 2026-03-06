import type { PredictPositionResponse } from '@/app/api/predict-position/schema';
import { observationsAtom } from '@/features/observation-input/model/atoms';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import ky from 'ky';
import {
  futureMinutesAtom,
  isPlayingTimelineAtom,
  predictionErrorAtom,
  predictionResultAtom,
  predictionStateAtom,
  selectedHypothesisIdAtom
} from '../model/prediction-atoms';

export function usePredictPosition() {
  const observations = useAtomValue(observationsAtom);
  const [state, setState] = useAtom(predictionStateAtom);
  const setResult = useSetAtom(predictionResultAtom);
  const setError = useSetAtom(predictionErrorAtom);
  const setSelectedId = useSetAtom(selectedHypothesisIdAtom);
  const setFutureMinutes = useSetAtom(futureMinutesAtom);
  const setIsPlaying = useSetAtom(isPlayingTimelineAtom);

  const predict = async (futureMinutesParam = 60) => {
    if (observations.length < 2) return;

    try {
      setState('predicting');
      setError(null);

      const response = await ky.post('/api/predict-position', {
        json: {
          observations,
          futureMinutes: futureMinutesParam,
          currentTime: new Date().toISOString()
        },
        timeout: 30000
      }).json<PredictPositionResponse>();

      setResult(response);
      setState('predicted');
      setSelectedId(null);
      setFutureMinutes(futureMinutesParam);
      setIsPlaying(false);
    } catch (err) {
      console.error("Prediction failed:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setState('error');
    }
  };

  return { predict, state, observationsCount: observations.length };
}
