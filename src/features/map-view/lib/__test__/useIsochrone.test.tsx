// src/features/map-view/lib/__tests__/useIsochrone.test.tsx

import { act, renderHook } from "@testing-library/react";
import { getDefaultStore, Provider } from "jotai";
import { describe, expect, it, Mock, vi } from "vitest";
import {
  futureMinutesAtom,
  observationsAtom,
} from "@/features/observation-input/model/atoms";
import { isochroneAtom } from "../../model/atoms";
import { useIsochrone } from "../useIsochrone";

global.fetch = vi.fn();

function wrapperFactory(store = getDefaultStore()) {
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
}

describe("useIsochrone", () => {
  it("마지막 관측 지점과 futureMinutes로 /api/isochrone를 호출하고 상태를 갱신한다", async () => {
    const store = getDefaultStore();

    store.set(observationsAtom, [
      {
        lat: 37.5665,
        lng: 126.978,
        timestamp: "2026-02-18T00:00:00.000Z",
        label: "A",
        address: "A addr",
      },
    ]);
    store.set(futureMinutesAtom, 15);

    (fetch as unknown as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        polygons: [{ coordinates: [[[126.97, 37.56]]] }],
        fallbackUsed: false,
        errors: null,
      }),
    });

    const { result } = renderHook(() => useIsochrone(), {
      wrapper: wrapperFactory(store),
    });

    await act(async () => {
      await result.current.computeIsochrone("walking");
    });

    const state = store.get(isochroneAtom);
    expect(state).not.toBeNull();
    if (!state) return;

    expect(state.profile).toBe("walking");
    expect(state.minutes).toBe(15);
    expect(state.polygons.length).toBe(1);
    expect(state.fallbackUsed).toBe(false);
  });
});
