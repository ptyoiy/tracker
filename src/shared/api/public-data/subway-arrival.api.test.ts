import { describe, expect, it } from "vitest";
import { getSubwayArrival } from "./subway-arrival";

describe("subway-arrival API", () => {
  it("should fetch real-time subway arrival info", async () => {
    // 서울 지하철역 이름 예시: "선릉"
    const stationName = "선릉";

    const result = await getSubwayArrival(stationName);
    console.dir(result, { depth: 3 });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      expect(result[0]).toHaveProperty("subwayId");
      expect(result[0]).toHaveProperty("trainLineNm");
      expect(result[0]).toHaveProperty("arvlMsg2");
    }
  });
});
