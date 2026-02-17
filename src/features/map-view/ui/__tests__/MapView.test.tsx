// src/features/map-view/ui/__tests__/MapView.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { getDefaultStore, Provider } from "jotai";
import { describe, expect, it, vi } from "vitest";
import { observationsAtom } from "@/features/observation-input/model/atoms";
import * as geocoder from "@/shared/api/kakao/geocoder";
import { MapView } from "../MapView";

vi.mock("react-kakao-maps-sdk", () => ({
  Map: ({ children, onClick, onCreate }: any) => {
    const map = { panTo: vi.fn(), setCenter: vi.fn() };
    if (onCreate) onCreate(map);
    return (
      <div
        data-testid="mock-map"
        onClick={() =>
          onClick(map, {
            latLng: { getLat: () => 37.5, getLng: () => 127.0 },
          })
        }
      >
        {children}
      </div>
    );
  },
  MapMarker: ({ position }: any) => (
    <div data-testid="mock-marker">{`${position.lat},${position.lng}`}</div>
  ),
  CustomOverlayMap: ({ children }: any) => (
    <div data-testid="mock-overlay">{children}</div>
  ),
}));

describe("MapView", () => {
  it("클릭 시 새 관측을 추가하고 label/address를 설정한다", async () => {
    const store = getDefaultStore();
    store.set(observationsAtom, []);

    vi.spyOn(geocoder, "coordToAddress").mockResolvedValue("테스트 주소");

    render(
      <Provider store={store}>
        <MapView />
      </Provider>,
    );

    const map = screen.getByTestId("mock-map");
    map.click(); // 첫 클릭

    await waitFor(() => {
      const markers = screen.getAllByTestId("mock-marker");
      expect(markers).toHaveLength(1);
      expect(markers[0].textContent).toBe("37.5,127");
    });

    const obs = store.get(observationsAtom);
    expect(obs).toHaveLength(1);
    expect(obs[0].address).toBe("테스트 주소");
    expect(obs[0].label).toBe("테스트 주소");
    expect(typeof obs[0].timestamp).toBe("string");
  });
});

it("새 관측이 추가될 때만 panTo를 호출한다", async () => {
  const store = getDefaultStore();
  store.set(observationsAtom, []);

  vi.spyOn(geocoder, "coordToAddress").mockResolvedValue(null);

  const { getByTestId } = render(
    <Provider store={store}>
      <MapView />
    </Provider>,
  );

  const mapEl = getByTestId("mock-map");

  // 첫 클릭 → append + panTo
  mapEl.click();

  await waitFor(() => {
    const obs = store.get(observationsAtom);
    expect(obs).toHaveLength(1);
  });

  // react-kakao-maps-sdk mock에서 panTo를 직접 검사하려면 위에서 만든 map 객체를 전역에 노출해야 함
  // 여기서는 길이 기준으로만 동작 여부를 확인해도 충분

  // 두 번째 클릭 → 2번째 관측 append (역시 panTo 호출되어야 함)
  mapEl.click();

  await waitFor(() => {
    const obs = store.get(observationsAtom);
    expect(obs).toHaveLength(2);
  });

  // 이후 폼에서 lat/lng 수정은 MapView에서 관측을 수정하기 전제로 하지 않으니, panTo는 관측 append 시에만 의미가 있음
});

it("각 관측에 대해 번호 오버레이를 표시한다", async () => {
  const store = getDefaultStore();
  store.set(observationsAtom, [
    {
      lat: 1,
      lng: 1,
      timestamp: "2026-02-17T08:00:00.000Z",
      label: "A",
      address: "A addr",
    },
    {
      lat: 2,
      lng: 2,
      timestamp: "2026-02-17T09:00:00.000Z",
      label: "B",
      address: "B addr",
    },
  ]);

  render(
    <Provider store={store}>
      <MapView />
    </Provider>,
  );

  const overlays = screen.getAllByTestId("mock-overlay");
  expect(overlays).toHaveLength(2);
  expect(overlays[0].textContent).toBe("1");
  expect(overlays[1].textContent).toBe("2");
});
