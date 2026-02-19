import { describe, expect, it } from "vitest";
import { RouteInfo } from "@/types/analyze";
import { filterByDurationTolerance } from "../route-filter";

describe("filterByDurationTolerance", () => {
  const routes: RouteInfo[] = [
    {
      id: "r1",
      totalDistanceKm: 1,
      totalDurationSeconds: 100,
      legs: [],
      primaryMode: "walking",
    },
    {
      id: "r2",
      totalDistanceKm: 1,
      totalDurationSeconds: 200,
      legs: [],
      primaryMode: "walking",
    },
    {
      id: "r3",
      totalDistanceKm: 1,
      totalDurationSeconds: 400,
      legs: [],
      primaryMode: "walking",
    },
  ];

  it("관측 duration ±30% 안에 있는 경로만 반환한다", () => {
    const observed = 200; // 허용 범위: 140~260
    const filtered = filterByDurationTolerance(routes, observed);
    const ids = filtered.map((r) => r.id);

    expect(ids).toContain("r2");
    expect(ids).not.toContain("r1");
    expect(ids).not.toContain("r3");
  });
});
