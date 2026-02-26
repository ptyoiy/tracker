// src/features/observation-input/model/atoms.ts
import { atom } from "jotai";
import { analysisResultAtom } from "@/features/route-analysis/model/atoms";
import type { Observation } from "@/types/observation";
import { computeObservationsHash } from "../lib/observation-hash";
import type { ObservationFormValues } from "./schema";

const baseObservationsAtom = atom<Observation[]>([]);

export const observationsAtom = atom(
  (get) => get(baseObservationsAtom),
  (
    get,
    set,
    nextObservations: Observation[] | ((prev: Observation[]) => Observation[]),
  ) => {
    const next =
      typeof nextObservations === "function"
        ? nextObservations(get(baseObservationsAtom))
        : nextObservations;

    const currentHash = computeObservationsHash(next);
    const analysisResult = get(analysisResultAtom);

    // 이전 분석에 사용된 해시와 현재 해시가 다르면 stale 설정
    if (
      analysisResult.observationsHash &&
      analysisResult.observationsHash !== currentHash
    ) {
      // 1. 경로 분석 stale 처리
      set(analysisResultAtom, (prev) => ({
        ...prev,
        stale: true,
      }));
    }

    set(baseObservationsAtom, next);
  },
);

export const futureMinutesAtom = atom<number>(10);
export const committedFutureMinutesAtom = atom<number>(10);

// 폼에서 submit할 때 전체 상태를 한번에 세팅하기 위한 atom
export const observationFormAtom = atom(
  (get) => ({
    observations: get(observationsAtom),
    futureMinutes: get(futureMinutesAtom),
  }),
  (_get, set, values: ObservationFormValues) => {
    // timestamp 문자열을 그대로 Observation 타입으로 매핑
    const sorted = [...values.observations].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    // observationsAtom의 커스텀 setter를 호출하여 stale 로직 실행
    set(observationsAtom, sorted);
    set(futureMinutesAtom, values.futureMinutes);
    set(committedFutureMinutesAtom, values.futureMinutes);
  },
);
