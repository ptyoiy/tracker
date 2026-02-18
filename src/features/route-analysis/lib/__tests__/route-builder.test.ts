import { describe, expect, it } from "vitest";
import type { TmapDrivingRoute } from "@/shared/api/tmap/driving";
import type { TmapPedestrianRoute } from "@/shared/api/tmap/pedestrian";
import type { TmapTransitRoute } from "@/shared/api/tmap/transit";
import {
  buildDrivingRouteInfo,
  buildPedestrianRouteInfo,
  buildTransitRouteInfo,
} from "../route-builder";

describe("route-builder", () => {
  it("보행자 경로를 RouteInfo로 변환한다", () => {
    const r: TmapPedestrianRoute = {
      distanceMeters: 1500,
      durationSeconds: 900,
      polyline: [
        { lat: 37.5, lng: 127 },
        { lat: 37.51, lng: 127.01 },
      ],
    };

    const info = buildPedestrianRouteInfo("p1", r);
    expect(info.id).toBe("p1");
    expect(info.totalDistanceKm).toBeCloseTo(1.5);
    expect(info.totalDurationSeconds).toBe(900);
    expect(info.primaryMode).toBe("walking");
    expect(info.legs).toHaveLength(1);
    expect(info.legs[0].polyline).toHaveLength(2);
  });

  it("차량 경로를 RouteInfo로 변환한다", () => {
    const r: TmapDrivingRoute = {
      distanceMeters: 10000,
      durationSeconds: 600,
      polyline: [
        { lat: 37.5, lng: 127 },
        { lat: 37.6, lng: 127.1 },
      ],
    };

    const info = buildDrivingRouteInfo("d1", r);
    expect(info.primaryMode).toBe("vehicle");
    expect(info.totalDistanceKm).toBeCloseTo(10);
  });

  it("대중교통 경로를 멀티모달 RouteInfo로 변환한다", () => {
    const r: TmapTransitRoute = {
      distanceMeters: 8000,
      durationSeconds: 1200,
      legs: [
        {
          mode: "WALK",
          distanceMeters: 500,
          durationSeconds: 300,
          polyline: [{ lat: 37.5, lng: 127 }],
        },
        {
          mode: "BUS",
          distanceMeters: 7500,
          durationSeconds: 900,
          polyline: [
            { lat: 37.51, lng: 127.01 },
            { lat: 37.6, lng: 127.1 },
          ],
        },
      ],
    };

    const info = buildTransitRouteInfo("t1", r);
    expect(info.totalDistanceKm).toBeCloseTo(8);
    expect(info.totalDurationSeconds).toBe(1200);
    expect(info.legs).toHaveLength(2);
    expect(info.primaryMode).toBe("transit"); // BUS가 포함되므로
  });
});
