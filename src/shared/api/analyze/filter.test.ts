import { describe, expect, it } from "vitest";
import { filterRoutesByTime } from "./filter";

describe("filterRoutesByTime", () => {
  it("허용 오차 내의 경로만 통과시킨다", () => {
    const routes = [
      { mode: "walking", estimatedDuration: 900 },
      { mode: "driving", estimatedDuration: 600 },
      { mode: "driving", estimatedDuration: 1500 },
    ];
    const actual = 1000; // 실제 Δt: 1000초
    const result = filterRoutesByTime(routes, actual, 0.3);

    // 1000초 기준 30% 오차 → [700, 1300] 구간만 허용
    expect(result).toHaveLength(1);
    expect(result.map((r) => r.estimatedDuration)).toEqual(
      [900, 1000].filter((t) => t !== 1000),
    ); // 없으니 900만
    expect(result[0].estimatedDuration).toBe(900);
  });
});
