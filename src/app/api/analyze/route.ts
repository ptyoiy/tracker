import { type NextRequest, NextResponse } from "next/server";
import { analyzeSegment } from "@/shared/api/analyze/segment";
import { getDrivingRoute } from "@/shared/api/tmap/driving";
import { getPedestrianRoute } from "@/shared/api/tmap/pedestrian";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  RouteInfo,
  SegmentAnalysis,
  TransportMode,
} from "@/types/analyze";

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { observations } = body;

    if (!observations || observations.length < 2) {
      return NextResponse.json(
        { segments: [], errors: "최소 2개의 관측 지점이 필요합니다." },
        { status: 400 },
      );
    }

    const segments: SegmentAnalysis[] = [];

    for (let i = 0; i < observations.length - 1; i++) {
      const from = observations[i];
      const to = observations[i + 1];

      const basic = analyzeSegment(from, to);
      const candidateRoutes: RouteInfo[] = [];

      const segmentId = `${i}-${i + 1}`;

      // 1. 보행자 경로 시도 (평균 속도가 낮거나 transportMode가 walking/transit인 경우)
      if (basic.transportMode === "walking" || basic.avgSpeed < 15) {
        try {
          const pedestrian = await getPedestrianRoute(from, to);
          if (pedestrian) {
            candidateRoutes.push({
              id: `${segmentId}-walking`,
              totalDistanceKm: pedestrian.distanceMeters / 1000,
              totalDurationSeconds: pedestrian.durationSeconds,
              primaryMode: "walking",
              legs: [
                {
                  mode: "WALK",
                  distanceKm: pedestrian.distanceMeters / 1000,
                  durationSeconds: pedestrian.durationSeconds,
                  polyline: pedestrian.polyline,
                },
              ],
            });
          }
        } catch (err) {
          console.error("TMAP pedestrian error:", err);
        }
      }

      // 2. 자동차 경로 시도 (평균 속도가 어느 정도 이상이거나 transportMode가 vehicle/transit인 경우)
      if (basic.transportMode === "vehicle" || basic.avgSpeed >= 6) {
        try {
          const driving = await getDrivingRoute(from, to);
          if (driving) {
            candidateRoutes.push({
              id: `${segmentId}-driving`,
              totalDistanceKm: driving.distanceMeters / 1000,
              totalDurationSeconds: driving.durationSeconds,
              primaryMode: "vehicle",
              legs: [
                {
                  mode: "CAR",
                  distanceKm: driving.distanceMeters / 1000,
                  durationSeconds: driving.durationSeconds,
                  polyline: driving.polyline,
                },
              ],
            });
          }
        } catch (err) {
          console.error("TMAP driving error:", err);
        }
      }

      segments.push({
        id: segmentId,
        fromIndex: i,
        toIndex: i + 1,
        from,
        to,
        distanceKm: basic.distance / 1000,
        durationSeconds: basic.duration,
        averageSpeedKmh: basic.avgSpeed,
        inferredMode: basic.transportMode as TransportMode,
        candidateRoutes,
      });
    }

    const response: AnalyzeResponse = {
      segments,
      errors: null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { segments: [], errors: "경로 분석 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
