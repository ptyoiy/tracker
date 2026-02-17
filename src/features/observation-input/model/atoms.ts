// src/features/observation-input/model/atoms.ts
import { atom } from "jotai";
import type { Observation } from "@/types/observation";
import type { ObservationFormValues } from "./schema";

export const observationsAtom = atom<Observation[]>([]);

export const futureMinutesAtom = atom<number>(10);

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
    set(observationsAtom, sorted);
    set(futureMinutesAtom, values.futureMinutes);
  },
);
