// src/features/map-view/ui/__tests__/IsochronePolygon.test.tsx
import { render, screen } from "@testing-library/react";
import { getDefaultStore, Provider } from "jotai";
import { describe, expect, it, vi } from "vitest";
import { isochroneAtom } from "../../model/atoms";
import { IsochronePolygon } from "../IsoChronePolygon";

vi.mock("react-kakao-maps-sdk", () => ({
  Polygon: ({ path }: { path: { lat: number; lng: number }[] }) => (
    <div data-testid="polygon">{JSON.stringify(path)}</div>
  ),
}));

describe("IsochronePolygon", () => {
  it("isochrone 상태가 없으면 아무것도 렌더링하지 않는다", () => {
    const store = getDefaultStore();
    render(
      <Provider store={store}>
        <IsochronePolygon />
      </Provider>,
    );
    expect(screen.queryByTestId("polygon")).toBeNull();
  });

  it("isochrone 폴리곤을 Kakao Polygon path로 변환해 렌더링한다", () => {
    const store = getDefaultStore();
    store.set(isochroneAtom, {
      profile: "walking",
      minutes: 10,
      polygons: [
        [
          [
            [126.97, 37.56],
            [126.98, 37.57],
          ],
        ],
      ],
      fallbackUsed: false,
    });

    render(
      <Provider store={store}>
        <IsochronePolygon />
      </Provider>,
    );

    const polygonEls = screen.getAllByTestId("polygon");
    expect(polygonEls).toHaveLength(1);

    const path = JSON.parse(polygonEls[0].textContent ?? "[]") as {
      lat: number;
      lng: number;
    }[];

    expect(path[0]).toEqual({ lat: 37.56, lng: 126.97 });
  });
});
