import { describe, expect, it } from "vitest";
import { getSubwayTimetable } from "../subway-timetable";

describe("subway-timetable API", () => {
  it("should fetch subway timetable info", async () => {
    // 역 코드 예: 선릉 분당선 (1075) 또는 선릉 2호선 (0220). api 테스트용으로 노선명 "2", 역명 "선릉" 사용
    const lineNm = "신분당";
    const stnNm = "강남";
    const weekTag = "1"; // 평일
    const inoutTag = "상행";

    const result = await getSubwayTimetable(lineNm, stnNm, weekTag, inoutTag);
    console.dir(result, { depth: 2 });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      expect(result[0]).toHaveProperty("trainno");
      expect(result[0]).toHaveProperty("trainArvlTm");
    }
  });
});
