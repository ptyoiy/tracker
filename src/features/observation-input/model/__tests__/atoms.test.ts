import { getDefaultStore } from "jotai";
import { describe, expect, it } from "vitest";
import {
  futureMinutesAtom,
  observationFormAtom,
  observationsAtom,
} from "../atoms";

describe("observationFormAtom", () => {
  it("시각 순으로 정렬하고 futureMinutes를 설정한다", () => {
    const store = getDefaultStore();

    const values = {
      observations: [
        {
          lat: 1,
          lng: 1,
          timestamp: "2026-02-17T09:00:00.000Z",
          label: "B",
          address: "B addr",
        },
        {
          lat: 2,
          lng: 2,
          timestamp: "2026-02-17T08:00:00.000Z",
          label: "A",
          address: "A addr",
        },
      ],
      futureMinutes: 20,
    };

    store.set(observationFormAtom, values);

    const obs = store.get(observationsAtom);
    expect(obs).toHaveLength(2);
    expect(obs[0].label).toBe("A"); // 더 이른 시간이 먼저

    const minutes = store.get(futureMinutesAtom);
    expect(minutes).toBe(20);
  });
});
