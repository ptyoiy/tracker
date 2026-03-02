import { describe, expect, it } from "vitest";
import { getStationByPos } from "../bus-station";

describe("bus-station API", () => {
  it("should fetch nearby bus stations", async () => {
    // 선릉역 인근 좌표 (반경 500m 이내 정류소 조회)
    const tmX = 127.04870992465413;
    const tmY = 37.505167825521674;
    const radius = 500;

    const result = await getStationByPos(tmX, tmY, radius);
    console.dir(result, { depth: 3 });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      expect(result[0]).toHaveProperty("stationId");
      expect(result[0]).toHaveProperty("stationNm");
      expect(result[0]).toHaveProperty("arsId");
    }
  });
});
