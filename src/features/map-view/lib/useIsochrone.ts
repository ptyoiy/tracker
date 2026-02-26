"use client";

import { useAtom, useAtomValue } from "jotai";
import { useCallback } from "react";
import { useIsochroneQuery } from "@/features/isochrone/api/useIsochroneQuery";
import {
  committedFutureMinutesAtom,
  futureMinutesAtom,
  observationsAtom,
} from "@/features/observation-input/model/atoms";
import { type IsochroneProfile, isochroneSelectionAtom } from "../model/atoms";

export function useIsochrone() {
  const [selection, setSelection] = useAtom(isochroneSelectionAtom);
  const observations = useAtomValue(observationsAtom);
  const [futureMinutes, setFutureMinutes] = useAtom(futureMinutesAtom);
  const committedMinutes = useAtomValue(committedFutureMinutesAtom);

  const target = observations[selection.observationIndex];

  const { data: isochrone, isLoading } = useIsochroneQuery(
    target?.lat ?? 0,
    target?.lng ?? 0,
    committedMinutes,
    selection.profile,
  );

  const computeIsochrone = useCallback(
    async (profile: IsochroneProfile, index?: number) => {
      setSelection((prev) => ({
        ...prev,
        profile,
        observationIndex: index ?? prev.observationIndex,
        minutes: futureMinutes, // 현재 설정된 시간을 반영
      }));
    },
    [setSelection, futureMinutes],
  );

  return {
    isochrone: isochrone
      ? {
          ...isochrone,
          profile: selection.profile,
          observationIndex: selection.observationIndex,
        }
      : null,
    computeIsochrone,
    futureMinutes,
    setFutureMinutes,
    isLoading,
    profile: selection.profile,
    observationIndex: selection.observationIndex,
  };
}
