// src/shared/api/tmap/__tests__/pedestrian.test.ts
import ky from "ky";
import { describe, expect, it, Mock, vi } from "vitest";
import { getPedestrianRoute } from "./pedestrian";

vi.mock("ky");

describe("getPedestrianRoute", () => {
  it("TMap 응답을 파싱해 거리/시간/폴리라인을 반환한다", async () => {
    (ky.post as unknown as Mock).mockReturnValueOnce({
      json: async () => ({
        properties: { totalDistance: 1500, totalTime: 900 },
        features: [
          {
            geometry: {
              type: "LineString",
              coordinates: [
                [127, 37.5],
                [127.01, 37.51],
              ],
            },
            properties: {},
            type: "Feature",
          },
        ],
      }),
    });

    const route = await getPedestrianRoute(
      { lat: 37.5, lng: 127 },
      { lat: 37.51, lng: 127.01 },
    );

    expect(route).not.toBeNull();
    if (!route) return;

    expect(route.distanceMeters).toBe(1500);
    expect(route.durationSeconds).toBe(900);
    expect(route.polyline).toHaveLength(2);
    expect(route.polyline[0]).toEqual({ lat: 37.5, lng: 127 });
  });

  it("예외 발생 시 null을 반환한다", async () => {
    (ky.post as unknown as Mock).mockImplementationOnce(() => {
      throw new Error("network");
    });

    const route = await getPedestrianRoute(
      { lat: 0, lng: 0 },
      { lat: 1, lng: 1 },
    );
    expect(route).toBeNull();
  });
});
