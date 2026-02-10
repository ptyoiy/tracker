import ky from "ky";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTmapDrivingRoute, type TmapDrivingResponse } from "./driving";

// ky 전체를 mock
vi.mock("ky", () => {
  return {
    default: {
      post: vi.fn(), // 이 post에 우리가 원하는 리턴값을 심는다
    },
  };
});

describe("getTmapDrivingRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TMAP_APP_KEY = "TEST_APP_KEY";
  });

  it("올바른 URL, 헤더, JSON 바디로 ky.post를 호출하고 응답을 그대로 반환한다", async () => {
    const from = { lat: 37.5547, lng: 126.9707 };
    const to = { lat: 37.5637, lng: 126.977 };

    const fakeResponse: TmapDrivingResponse = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [126.9707, 37.5547],
              [126.977, 37.5637],
            ],
          },
          properties: {
            totalDistance: 1500,
            totalTime: 600,
          },
        },
      ],
    };

    // json() 메서드를 가진 객체를 즉시 반환하도록 수정
    const mockJsonFn = vi.fn().mockResolvedValue(fakeResponse);

    vi.mocked(ky.post).mockReturnValue({
      json: mockJsonFn,
    } as any);

    const result = await getTmapDrivingRoute(from, to);

    // 호출 검증
    expect(ky.post).toHaveBeenCalledTimes(1);
    expect(ky.post).toHaveBeenCalledWith(
      "https://apis.openapi.sk.com/tmap/routes",
      {
        headers: {
          appKey: "TEST_APP_KEY",
          "Content-Type": "application/json",
        },
        json: {
          startX: from.lng,
          startY: from.lat,
          endX: to.lng,
          endY: to.lat,
          reqCoordType: "WGS84GEO",
          resCoordType: "WGS84GEO",
        },
        timeout: 10000,
      },
    );

    // json() 메서드가 호출되었는지 확인
    expect(mockJsonFn).toHaveBeenCalledTimes(1);

    // 반환값 검증
    expect(result).toEqual(fakeResponse);
  });

  it("TMAP_APP_KEY가 없으면 에러가 발생한다", async () => {
    delete process.env.TMAP_APP_KEY;

    const from = { lat: 37.5547, lng: 126.9707 };
    const to = { lat: 37.5637, lng: 126.977 };

    // 이 경우에도 mock 설정 필요 (실제 호출이 일어나므로)
    const mockJsonFn = vi.fn();
    vi.mocked(ky.post).mockReturnValue({
      json: mockJsonFn,
    } as any);

    await expect(getTmapDrivingRoute(from, to)).rejects.toThrow();
  });
});
