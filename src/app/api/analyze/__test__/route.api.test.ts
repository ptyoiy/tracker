import { describe, expect, it, vi } from "vitest";
import * as tmapDrv from "@/shared/api/tmap/driving";
import * as tmapPed from "@/shared/api/tmap/pedestrian";
import * as tmapTrn from "@/shared/api/tmap/transit";
import { AnalyzeRequest } from "@/types/analyze";
import { POST } from "../route";

describe("POST /api/analyze", () => {
  it("관측이 2개 미만이면 400과 fallbackUsed=true를 반환한다", async () => {
    const req = new Request("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        observations: [],
        futureMinutes: 10,
      } satisfies AnalyzeRequest),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.fallbackUsed).toBe(true);
    expect(body.segments).toHaveLength(0);
  });

  it("TMAP 경로 없이도 직선 기반 SegmentAnalysis를 반환한다", async () => {
    const analyzeReq: AnalyzeRequest = {
      observations: [
        {
          lat: 37.5665,
          lng: 126.978,
          timestamp: "2026-02-18T00:00:00.000Z",
          label: "A",
          address: "A addr",
        },
        {
          lat: 37.5547,
          lng: 126.9707,
          timestamp: "2026-02-18T00:10:00.000Z",
          label: "B",
          address: "B addr",
        },
      ],
      futureMinutes: 10,
    };

    // TMAP 래퍼는 전부 null을 반환하도록 mock
    vi.spyOn(tmapPed, "getPedestrianRoute").mockResolvedValue(null);
    vi.spyOn(tmapDrv, "getDrivingRoute").mockResolvedValue(null);
    vi.spyOn(tmapTrn, "getTransitRoute").mockResolvedValue(null);

    const req = new Request("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify(analyzeReq),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.segments).toHaveLength(1);
    expect(body.segments[0].candidateRoutes).toHaveLength(0);
    expect(body.fallbackUsed).toBe(true);
  });

  it("TMAP 경로가 duration 허용 범위 안이면 candidateRoutes에 포함된다", async () => {
    const analyzeReq: AnalyzeRequest = {
      observations: [
        {
          lat: 37.5665,
          lng: 126.978,
          timestamp: "2026-02-18T00:00:00.000Z",
          label: "A",
          address: "A addr",
        },
        {
          lat: 37.5665,
          lng: 126.978,
          timestamp: "2026-02-18T00:10:00.000Z",
          label: "B",
          address: "B addr",
        },
      ],
      futureMinutes: 10,
    };

    // 관측 duration = 600초, TMAP duration = 610초 → ±30% 안
    vi.spyOn(tmapPed, "getPedestrianRoute").mockResolvedValue({
      distanceMeters: 1000,
      durationSeconds: 610,
      polyline: [{ lat: 37.5665, lng: 126.978 }],
    });

    vi.spyOn(tmapDrv, "getDrivingRoute").mockResolvedValue(null);
    vi.spyOn(tmapTrn, "getTransitRoute").mockResolvedValue(null);

    const req = new Request("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify(analyzeReq),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.segments).toHaveLength(1);
    expect(body.segments[0].candidateRoutes.length).toBeGreaterThan(0);
    expect(body.fallbackUsed).toBe(false);
  });
});
