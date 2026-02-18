// src/app/api/isochrone/__tests__/route.test.ts

import { describe, expect, it, vi } from "vitest";
import * as mapboxIso from "@/shared/api/mapbox/isochrone";
import * as fallback from "@/shared/lib/geo/isochrone-fallback";
import { POST } from "../route";

describe("POST /api/isochrone", () => {
  it("잘못된 요청이면 400을 반환한다", async () => {
    const req = new Request("http://localhost/api/isochrone", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.fallbackUsed).toBe(true);
  });

  it("Mapbox 폴리곤이 있으면 fallbackUsed=false로 반환한다", async () => {
    vi.spyOn(mapboxIso, "fetchIsochroneFromMapbox").mockResolvedValue([
      { coordinates: [[[126.97, 37.56]]] },
    ]);
    vi.spyOn(fallback, "buildFallbackIsochrone").mockImplementation(() => ({
      coordinates: [],
    }));

    const req = new Request("http://localhost/api/isochrone", {
      method: "POST",
      body: JSON.stringify({
        lat: 37.5665,
        lng: 126.978,
        minutes: 10,
        profile: "walking",
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.polygons).toHaveLength(1);
    expect(body.fallbackUsed).toBe(false);
  });

  it("Mapbox가 null이면 fallback 폴리곤을 반환하고 fallbackUsed=true", async () => {
    vi.spyOn(mapboxIso, "fetchIsochroneFromMapbox").mockResolvedValue(null);
    vi.spyOn(fallback, "buildFallbackIsochrone").mockReturnValue({
      coordinates: [[[126.97, 37.56]]],
    });

    const req = new Request("http://localhost/api/isochrone", {
      method: "POST",
      body: JSON.stringify({
        lat: 37.5665,
        lng: 126.978,
        minutes: 10,
        profile: "walking",
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.polygons).toHaveLength(1);
    expect(body.fallbackUsed).toBe(true);
  });
});
