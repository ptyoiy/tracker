import { describe, expect, it } from "vitest";
import { getDistanceKm } from "../geo/distance";

describe("getDistanceKm", () => {
  it("같은 좌표는 0km를 반환한다", () => {
    const d = getDistanceKm({ lat: 37.5, lng: 127 }, { lat: 37.5, lng: 127 });
    expect(d).toBeCloseTo(0);
  });

  it("서울 시청–서울역 거리가 대략 1~3km 사이여야 한다", () => {
    const d = getDistanceKm(
      { lat: 37.5665, lng: 126.978 }, // 시청
      { lat: 37.5547, lng: 126.9707 }, // 서울역
    );
    expect(d).toBeGreaterThan(1);
    expect(d).toBeLessThan(3);
  });
});
