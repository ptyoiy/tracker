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
    expect(state.observationIndex).toBe(0); // 1개일 땐 index 0
  });

  it("특정 인덱스를 지정하면 해당 지점으로 /api/isochrone를 호출한다", async () => {
    const store = getDefaultStore();

    store.set(observationsAtom, [
      {
        lat: 37.1,
        lng: 126.1,
        timestamp: "T1",
        label: "A",
        address: "A",
      },
      {
        lat: 37.2,
        lng: 126.2,
        timestamp: "T2",
        label: "B",
        address: "B",
      },
    ]);

    (fetch as unknown as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        polygons: [{ coordinates: [] }],
        fallbackUsed: false,
        errors: null,
      }),
    });

    const { result } = renderHook(() => useIsochrone(), {
      wrapper: wrapperFactory(store),
    });

    await act(async () => {
      // index 0 지점(37.1, 126.1)으로 호출 요청
      await result.current.computeIsochrone("driving", 0);
    });

    // fetch body 검증
    expect(fetch).toHaveBeenCalledWith(
      "/api/isochrone",
      expect.objectContaining({
        body: JSON.stringify({
          lat: 37.1,
          lng: 126.1,
          minutes: 10,
          profile: "driving",
        }),
      }),
    );

    const state = store.get(isochroneAtom);
    expect(state?.observationIndex).toBe(0);
  });

  it("동일한 파라미터로 호출 시 캐시된 결과를 사용하고 fetch를 다시 호출하지 않는다", async () => {
    const store = getDefaultStore();

    store.set(observationsAtom, [
      {
        lat: 37.5,
        lng: 126.5,
        timestamp: "T1",
        label: "A",
        address: "A",
      },
    ]);

    (fetch as unknown as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        polygons: [{ coordinates: [] }],
        fallbackUsed: false,
        errors: null,
      }),
    });

    const { result } = renderHook(() => useIsochrone(), {
      wrapper: wrapperFactory(store),
    });

    // 첫 번째 호출
    await act(async () => {
      await result.current.computeIsochrone("walking");
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    // 두 번째 호출 (동일 파라미터)
    await act(async () => {
      await result.current.computeIsochrone("walking");
    });

    // 호출 횟수가 여전히 1이어야 함 (캐시 사용)
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
