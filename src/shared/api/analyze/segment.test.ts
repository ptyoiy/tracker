import { describe, expect, it } from "vitest";
import { analyzeSegment } from "./segment";

describe("analyzeSegment", () => {
  const baseTime = "2026-02-10T00:00:00.000Z";

  it("도보 속도로 이동 시 walking으로 판정", () => {
    const from = { lat: 37.0, lng: 127.0, timestamp: baseTime };
    const to = {
      lat: 37.009,
      lng: 127.0,
      timestamp: "2026-02-10T00:15:00.000Z",
    }; // 약 1km

    const result = analyzeSegment(from, to);

    expect(result.distance).toBeGreaterThan(900);
    expect(result.distance).toBeLessThan(1100);
    expect(result.avgSpeed).toBeGreaterThan(3);
    expect(result.avgSpeed).toBeLessThan(6);
    expect(result.transportMode).toBe("walking");
  });

  it("고속 이동 시 vehicle로 판정", () => {
    const from = { lat: 37.0, lng: 127.0, timestamp: baseTime };
    const to = {
      lat: 37.18,
      lng: 127.0,
      timestamp: "2026-02-10T00:10:00.000Z",
    }; // 약 20km

    const result = analyzeSegment(from, to);

    expect(result.avgSpeed).toBeGreaterThan(80);
    expect(result.transportMode).toBe("vehicle");
  });
});
