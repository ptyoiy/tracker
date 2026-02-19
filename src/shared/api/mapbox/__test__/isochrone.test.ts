// src/shared/api/mapbox/__tests__/isochrone.test.ts
import ky from "ky";
import { describe, expect, it, Mock, vi } from "vitest";
import { fetchIsochroneFromMapbox } from "../isochrone";

vi.mock("ky");

describe("fetchIsochroneFromMapbox", () => {
  it("Mapbox 응답에서 폴리곤 좌표를 추출한다", async () => {
    (ky.get as unknown as Mock).mockReturnValueOnce({
      json: async () => ({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [126.97, 37.56],
                  [126.98, 37.56],
                  [126.98, 37.57],
                  [126.97, 37.57],
                  [126.97, 37.56],
                ],
              ],
            },
            properties: { contour: 10 },
          },
        ],
      }),
    });

    const polygons = await fetchIsochroneFromMapbox(
      "walking",
      { lat: 37.5665, lng: 126.978 },
      10,
    );

    expect(polygons).not.toBeNull();
    if (!polygons) return;

    expect(polygons).toHaveLength(1);
    expect(polygons[0].coordinates[0][0]).toEqual([126.97, 37.56]);
  });

  it("에러 시 null을 반환한다", async () => {
    (ky.get as unknown as Mock).mockImplementationOnce(() => {
      throw new Error("network");
    });

    const polygons = await fetchIsochroneFromMapbox(
      "walking",
      { lat: 0, lng: 0 },
      10,
    );
    expect(polygons).toBeNull();
  });
});
