import { describe, expect, it } from "vitest";
import { getStationByUid } from "./bus-arrival";

describe("bus-arrival API", () => {
  it("should fetch real-time arrival info for a station", async () => {
    // 임의의 버스 정류소 고유 번호 (arsId) - 예: 강남역 정류장 '22009' 등, 여기서는 빈번한 버스 정류소를 하나 지정
    const testArsId = "22009";

    const result = await getStationByUid(testArsId);
    console.dir(result, { depth: 3 });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      expect(result[0]).toHaveProperty("busRouteId");
      expect(result[0]).toHaveProperty("rtNm");
      expect(result[0]).toHaveProperty("arrmsg1");
    }
  });
});
