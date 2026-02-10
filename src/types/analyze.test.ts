import { describe, expect, it } from "vitest";
import { analyzeRequestSchema } from "./analyze";

describe("analyzeRequestSchema", () => {
  it("유효한 입력은 통과한다", () => {
    const data = {
      observations: [
        {
          lat: 37.5,
          lng: 126.9,
          timestamp: "2026-02-10T00:00:00.000Z",
        },
        {
          lat: 37.6,
          lng: 127.0,
          timestamp: "2026-02-10T00:10:00.000Z",
        },
      ],
      futureMinutes: 15,
    };

    const parsed = analyzeRequestSchema.parse(data);
    expect(parsed.observations).toHaveLength(2);
    expect(parsed.futureMinutes).toBe(15);
  });

  it("관측 지점이 1개면 에러를 던진다", () => {
    const data = {
      observations: [
        {
          lat: 37.5,
          lng: 126.9,
          timestamp: "2026-02-10T00:00:00.000Z",
        },
      ],
      futureMinutes: 10,
    };

    expect(() => analyzeRequestSchema.parse(data)).toThrow();
  });

  it("futureMinutes가 없으면 기본값 10을 사용한다", () => {
    const data = {
      observations: [
        {
          lat: 37.5,
          lng: 126.9,
          timestamp: "2026-02-10T00:00:00.000Z",
        },
        {
          lat: 37.6,
          lng: 127.0,
          timestamp: "2026-02-10T00:10:00.000Z",
        },
      ],
    };

    const parsed = analyzeRequestSchema.parse(data);
    expect(parsed.futureMinutes).toBe(10);
  });
});
