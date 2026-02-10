import ky from "ky";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getTmapPedestrianRoute,
  type TmapPedestrianResponse,
} from "./pedestrian";

// ky.post를 mock
vi.mock("ky", () => {
  return {
    default: {
      post: vi.fn(),
    },
  };
});

describe("getTmapPedestrianRoute", () => {
  const mockedKy = ky as unknown as {
    post: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TMAP_APP_KEY = "TEST_APP_KEY";
  });

  it("올바른 URL, 헤더, JSON 바디로 ky.post를 호출하고 응답을 그대로 반환한다", async () => {
    const from = { lat: 37.5547, lng: 126.9707 };
    const to = { lat: 37.5637, lng: 126.977 };

    const fakeResponse: TmapPedestrianResponse = {
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
            totalDistance: 1200,
            totalTime: 900,
          },
        },
      ],
    };

    // ky.post가 .json()을 지원하는 객체를 반환하도록 mock
    const mockJsonFn = vi.fn().mockResolvedValue(fakeResponse);

    mockedKy.post.mockReturnValue({
      json: mockJsonFn,
    } as any);

    const result = await getTmapPedestrianRoute(from, to);

    // URL 검증
    expect(mockedKy.post).toHaveBeenCalledTimes(1);
    const [url, options] = mockedKy.post.mock.calls[0];

    expect(url).toBe("https://apis.openapi.sk.com/tmap/routes/pedestrian");

    // 헤더 검증
    expect(options?.headers).toEqual({
      appKey: "TEST_APP_KEY",
      "Content-Type": "application/json",
    });

    // JSON 바디 검증
    expect(options?.json).toEqual({
      startX: from.lng,
      startY: from.lat,
      endX: to.lng,
      endY: to.lat,
      startName: "출발",
      endName: "도착",
      reqCoordType: "WGS84GEO",
      resCoordType: "WGS84GEO",
    });

    // timeout 옵션 검증
    expect(options?.timeout).toBe(10000);

    // 반환값 검증
    expect(result).toEqual(fakeResponse);
  });

  it("TMAP_APP_KEY가 없으면 런타임 에러가 발생한다", async () => {
    delete process.env.TMAP_APP_KEY;

    const from = { lat: 37.5547, lng: 126.9707 };
    const to = { lat: 37.5637, lng: 126.977 };

    // 실제로는 TypeError가 날 수 있으므로, 에러 발생 여부만 확인
    await expect(getTmapPedestrianRoute(from, to)).rejects.toThrow();
  });
});
