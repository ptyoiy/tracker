import { describe, expect, it } from "vitest";
import { getRouteInfo } from "./bus-route-info";

describe("bus-route-info API", () => {
  it("should fetch route detailed info", async () => {
    // 임의의 노선 ID. 한남여객운수 146번 버스 노선 ID 예제: "100100021"
    const testRouteId = "100100021";

    const result = await getRouteInfo(testRouteId);
    console.dir(result, { depth: 3 });

    expect(result).toBeDefined();
    if (result) {
      expect(result).toHaveProperty("busRouteId");
      expect(result).toHaveProperty("busRouteNm");
      expect(result).toHaveProperty("firstBusTm");
      expect(result).toHaveProperty("lastBusTm");
    }
  });
});
