// src/shared/lib/geo/__tests__/isochrone-fallback.test.ts
import { describe, expect, it } from "vitest";
import { buildFallbackIsochrone } from "../isochrone-fallback";

describe("buildFallbackIsochrone", () => {
  it("프로필과 시간에 따라 GeoJSON Polygon을 생성한다", () => {
    const poly = buildFallbackIsochrone(
      "walking",
      { lat: 37.5665, lng: 126.978 },
      10,
    );

    expect(poly.coordinates.length).toBeGreaterThan(0);
    expect(poly.coordinates[0].length).toBeGreaterThan(3);
    // 첫 점은 [lng, lat] 형태여야 한다
    const first = poly.coordinates[0][0];
    expect(first).toHaveLength(2);
    expect(typeof first[0]).toBe("number");
    expect(typeof first[1]).toBe("number");
  });
});
