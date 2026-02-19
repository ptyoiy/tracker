// src/shared/api/tmap/__tests__/pedestrian.test.ts
import ky from "ky";
import { describe, expect, it, Mock, vi } from "vitest";
import { getDrivingRoute } from "./driving";

vi.mock("ky");

describe("getDrivingRoute", () => {
  it("TMap 응답을 파싱해 거리/시간/폴리라인을 반환한다", async () => {
    (ky.post as unknown as Mock).mockReturnValueOnce({
      json: async () => ({
        properties: { totalDistance: 10_000, totalTime: 600 },
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [127, 37.5],
                [127.1, 37.6],
              ],
            },
            properties: {},
          },
        ],
      }),
    });

    const route = await getDrivingRoute(
      { lat: 37.5, lng: 127 },
      { lat: 37.6, lng: 127.1 },
    );

    expect(route).not.toBeNull();
    if (!route) return;

    expect(route.distanceMeters).toBe(10_000);
    expect(route.durationSeconds).toBe(600);
    expect(route.polyline).toHaveLength(2);
    expect(route.polyline[0]).toEqual({ lat: 37.5, lng: 127 });
  });

  it("예외 발생 시 null을 반환한다", async () => {
    (ky.post as unknown as Mock).mockImplementationOnce(() => {
      throw new Error("network");
    });

    const route = await getDrivingRoute({ lat: 0, lng: 0 }, { lat: 1, lng: 1 });
    expect(route).toBeNull();
  });
});
