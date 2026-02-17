// src/shared/lib/__tests__/speed.test.ts
import { describe, expect, it } from "vitest";
import { SPEED_THRESHOLD } from "@/shared/config/constant";
import { calcSpeedKmh, inferSpeedCategory } from "../speed";

describe("calcSpeedKmh", () => {
  it("거리/시간으로 km/h를 계산한다", () => {
    expect(calcSpeedKmh(1, 3600)).toBeCloseTo(1);
    expect(calcSpeedKmh(10, 3600)).toBeCloseTo(10);
  });

  it("durationSeconds가 0 이하일 때 0을 반환한다", () => {
    expect(calcSpeedKmh(1, 0)).toBe(0);
    expect(calcSpeedKmh(1, -10)).toBe(0);
  });
});

describe("inferSpeedCategory", () => {
  it("threshold 기준으로 walking/transit/vehicle을 분류한다", () => {
    expect(inferSpeedCategory(SPEED_THRESHOLD.WALKING_MAX - 0.1)).toBe(
      "walking",
    );
    expect(inferSpeedCategory(SPEED_THRESHOLD.WALKING_MAX + 0.1)).toBe(
      "transit",
    );
    expect(inferSpeedCategory(SPEED_THRESHOLD.TRANSIT_MAX + 0.1)).toBe(
      "vehicle",
    );
  });
});
