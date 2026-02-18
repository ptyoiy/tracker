import { describe, expect, it } from "vitest";
import { buildSegmentAnalyses } from "../segment-analyzer";

describe("buildSegmentAnalyses", () => {
  it("관측이 2개 미만이면 빈 배열을 반환한다", () => {
    expect(buildSegmentAnalyses([])).toEqual([]);
  });

  it("연속 관측 쌍마다 SegmentAnalysis를 생성한다", () => {
    const observations = [
      {
        lat: 37.5665,
        lng: 126.978,
        timestamp: "2026-02-18T00:00:00.000Z",
        label: "A",
        address: "A addr",
      },
      {
        lat: 37.5547,
        lng: 126.9707,
        timestamp: "2026-02-18T00:10:00.000Z",
        label: "B",
        address: "B addr",
      },
    ];

    const segments = buildSegmentAnalyses(observations);
    expect(segments).toHaveLength(1);

    const s = segments[0];
    expect(s.fromIndex).toBe(0);
    expect(s.toIndex).toBe(1);
    expect(s.distanceKm).toBeGreaterThan(1);
    expect(s.durationSeconds).toBe(600);
    expect(s.averageSpeedKmh).toBeGreaterThan(5);
    expect(["walking", "transit", "vehicle"]).toContain(s.inferredMode);
  });
});
