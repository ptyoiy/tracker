import { format } from "date-fns";
import { type NextRequest, NextResponse } from "next/server";
import { analyzeSegment } from "@/shared/api/analyze/segment";
import { getDrivingRoute } from "@/shared/api/tmap/driving";
import { getPedestrianRoute } from "@/shared/api/tmap/pedestrian";
// import { getTransitRoute } from "@/shared/api/tmap/transit";
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
    let fallbackUsed = false;

    for (let i = 0; i < observations.length - 1; i++) {
      const from = observations[i];
      const to = observations[i + 1];

      const basic = analyzeSegment(from, to);
      const candidateRoutes: RouteInfo[] = [];
      const segmentId = `${i}-${i + 1}`;

      // 대중교통 조회를 위한 시간 포맷팅 (YYYYMMDDHHMM)
      const _searchDttm = format(new Date(from.timestamp), "yyyyMMddHHmm");

      // 3개 수단 병렬 호출
      const [pedResult, drivResult, transResult] = await Promise.allSettled([
        getPedestrianRoute(from, to),
        getDrivingRoute(from, to),
        // 요청 한도가 일일 10개로 매우 부족하니까 일단 실패로 넣고 필요할 때만 주석 빼서 테스트하기.
        Promise.reject(), //getTransitRoute(from, to, searchDttm),
      ]);

      // 1. 도보 경로 처리
      if (pedResult.status === "fulfilled" && pedResult.value) {
        const ped = pedResult.value;
        const duration = ped.durationSeconds;
        const isReasonable =
          Math.abs(duration - basic.duration) / basic.duration <= 0.3;
        candidateRoutes.push({
          id: `${segmentId}-walking`,
          totalDistanceKm: ped.distanceMeters / 1000,
          totalDurationSeconds: duration,
          primaryMode: "walking",
          isReasonable,
          legs: [
            {
              mode: "WALK",
              distanceKm: ped.distanceMeters / 1000,
              durationSeconds: duration,
              polyline: ped.polyline,
            },
          ],
        });
      }

      // 2. 자동차 경로 처리
      if (drivResult.status === "fulfilled" && drivResult.value) {
        const driv = drivResult.value;
        const duration = driv.durationSeconds;
        const isReasonable =
          Math.abs(duration - basic.duration) / basic.duration <= 0.3;
        candidateRoutes.push({
          id: `${segmentId}-driving`,
          totalDistanceKm: driv.distanceMeters / 1000,
          totalDurationSeconds: duration,
          primaryMode: "vehicle",
          isReasonable,
          legs: [
            {
              mode: "CAR",
              distanceKm: driv.distanceMeters / 1000,
              durationSeconds: duration,
              polyline: driv.polyline,
            },
          ],
        });
      }

      // 3. 대중교통 경로 처리
      // if (transResult.status === "fulfilled" && transResult.value) {
      //   const trans = transResult.value;
      //   const duration = trans.durationSeconds;
      //   const isReasonable =
      //     Math.abs(duration - basic.duration) / basic.duration <= 0.3;
      //   candidateRoutes.push({
      //     id: `${segmentId}-transit`,
      //     totalDistanceKm: trans.distanceMeters / 1000,
      //     totalDurationSeconds: duration,
      //     primaryMode: "transit",
      //     isReasonable,
      //     legs: trans.legs.map((leg) => ({
      //       mode: leg.mode as any, // BUS, SUBWAY, WALK 등
      //       distanceKm: leg.distanceMeters / 1000,
      //       durationSeconds: leg.durationSeconds,
      //       polyline: leg.polyline,
      //     })),
      //   });
      // }

      // 모든 API가 실패했거나 결과가 없을 경우 fallbackUsed 체크
      if (candidateRoutes.length === 0) {
        fallbackUsed = true;
      }

      // 후보지들을 실제 시간차와 가까운 순서대로 정렬
      candidateRoutes.sort(
        (a, b) =>
          Math.abs(a.totalDurationSeconds - basic.duration) -
          Math.abs(b.totalDurationSeconds - basic.duration),
      );

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
      fallbackUsed,
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
