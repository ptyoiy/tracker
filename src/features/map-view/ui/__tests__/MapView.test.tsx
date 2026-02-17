// src/features/map-view/ui/__tests__/MapView.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { getDefaultStore, Provider } from "jotai";
import { describe, expect, it, vi } from "vitest";
import { observationsAtom } from "@/features/observation-input/model/atoms";
import * as geocoder from "@/shared/api/kakao/geocoder";
import { MapView } from "../MapView";

vi.mock("react-kakao-maps-sdk", () => ({
  Map: ({ children, onClick }: any) => (
    <div
      data-testid="mock-map"
      onClick={() =>
        onClick({}, { latLng: { getLat: () => 37.5, getLng: () => 127.0 } })
      }
    >
      {children}
    </div>
  ),
  MapMarker: ({ position }: any) => (
    <div data-testid="mock-marker">{`${position.lat},${position.lng}`}</div>
  ),
}));

describe("MapView", () => {
  it("클릭 시 coordToAddress 호출 후 마지막 관측 지점을 갱신한다", async () => {
    const store = getDefaultStore();
    store.set(observationsAtom, [
      { lat: 1, lng: 1, timestamp: "2026-02-17T08:00:00.000Z" },
      { lat: 2, lng: 2, timestamp: "2026-02-17T09:00:00.000Z" },
    ]);

    const geocoderSpy = vi
      .spyOn(geocoder, "coordToAddress")
      .mockResolvedValue("테스트 주소");

    render(
      <Provider store={store}>
        <MapView />
      </Provider>,
    );

    const map = screen.getByTestId("mock-map");
    map.click();

    await waitFor(() => {
      const markers = screen.getAllByTestId("mock-marker");
      // 마지막 관측 지점이 클릭 좌표로 변경되었는지 확인
      expect(markers[1].textContent).toBe("37.5,127");
    });

    const obs = store.get(observationsAtom);
    expect(obs[1].address).toBe("테스트 주소");

    geocoderSpy.mockRestore();
  });
});
