import { analyzeSegment } from "@/shared/api/analyze/segment";
import { getDrivingRoute } from "@/shared/api/tmap/driving";
import { getPedestrianRoute } from "@/shared/api/tmap/pedestrian";
import {
  getTransitRoute,
  type TmapTransitLegMode,
} from "@/shared/api/tmap/transit";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  RouteGroup,
  RouteInfo,
  RouteLeg,
  SegmentAnalysis,
  TransportMode,
} from "@/types/analyze";
import { format } from "date-fns";
import { type NextRequest, NextResponse } from "next/server";

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
      const searchDttm = format(new Date(from.timestamp), "yyyyMMddHHmm");

      // 3개 수단 병렬 호출
      const [pedResult, drivResult, transResult] = await Promise.allSettled([
        getPedestrianRoute(from, to),
        getDrivingRoute(from, to),
        // 요청 한도가 일일 10개로 매우 부족하니까 일단 실패로 넣고 필요할 때만 주석 빼서 테스트하기.
        //Promise.reject(),
        getTransitRoute(from, to, searchDttm),
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
      if (transResult.status === "fulfilled" && transResult.value) {
        transResult.value.forEach((trans, index) => {
          const duration = trans.durationSeconds;
          const isReasonable =
            Math.abs(duration - basic.duration) / basic.duration <= 0.3;
          candidateRoutes.push({
            id: `${segmentId}-transit-${index}`,
            totalDistanceKm: trans.distanceMeters / 1000,
            totalDurationSeconds: duration,
            primaryMode: "transit",
            isReasonable,
            legs: trans.legs.map((leg) => ({
              mode: leg.mode as TmapTransitLegMode, // BUS, SUBWAY, WALK 등
              distanceKm: leg.distanceMeters / 1000,
              durationSeconds: leg.durationSeconds,
              polyline: leg.polyline,
              route: leg.route,
            })),
          });
        });
      }

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

      // --- 버스 경로 오버랩 그룹핑 로직 (엄격한 기준 적용) ---
      const overlapGroups: RouteGroup[] = [];

      // 1. transit 경로 중 BUS leg가 하나 존재하는 경로들만 추출
      type TransitRouteInfo = {
        route: RouteInfo;
        busLeg: RouteLeg;
        busLegIdx: number;
      };
      const busCandidates: TransitRouteInfo[] = candidateRoutes
        .filter((r) => r.primaryMode === "transit")
        .map((r) => {
          const busLegIdx = r.legs.findIndex((leg) => leg.mode === "BUS");
          // 현재는 심플하게 BUS leg가 있는 경로 중 첫 번째 BUS leg를 기준으로 그룹핑
          return { route: r, busLeg: r.legs[busLegIdx], busLegIdx };
        })
        .filter((c) => c.busLegIdx !== -1 && c.busLeg.polyline.length >= 2);

      // 거리 계산 헬퍼 (단순 피타고라스 / 혹은 turf 사용 가능. 여기선 간단한 위경도 차이로 근사)
      // 위도 1도 약 111km, 경도 1도 약 88km (서울 기준) -> 50m는 대략 0.0005도
      const isClose = (
        p1: { lat: number; lng: number },
        p2: { lat: number; lng: number },
      ) => {
        const dLat = Math.abs(p1.lat - p2.lat);
        const dLng = Math.abs(p1.lng - p2.lng);
        return dLat < 0.0006 && dLng < 0.0006;
      };

      // 2. 그룹핑
      for (const candidate of busCandidates) {
        let matchedGroup = null;
        const busPoly = candidate.busLeg.polyline;
        const startStop = busPoly[0];
        const endStop = busPoly[busPoly.length - 1];

        for (const group of overlapGroups) {
          const groupPoly = group.commonPolyline;
          const groupStart = groupPoly[0];
          const groupEnd = groupPoly[groupPoly.length - 1];

          // 시작점과 종료점이 모두 비슷한 경우에만 같은 그룹으로 취급
          if (isClose(startStop, groupStart) && isClose(endStop, groupEnd)) {
            matchedGroup = group;
            break;
          }
        }

        if (matchedGroup) {
          matchedGroup.memberRouteIds.push(candidate.route.id);
          const busNo = candidate.busLeg.route || "Unknown";
          if (!matchedGroup.busNumbers.includes(busNo)) {
            matchedGroup.busNumbers.push(busNo);
          }
          // duration range 갱신
          const duration = candidate.route.totalDurationSeconds;
          matchedGroup.durationRange[0] = Math.min(
            matchedGroup.durationRange[0],
            duration,
          );
          matchedGroup.durationRange[1] = Math.max(
            matchedGroup.durationRange[1],
            duration,
          );
        } else {
          // 새 그룹 생성
          overlapGroups.push({
            id: `group_${segmentId}_${overlapGroups.length + 1}`,
            busNumbers: [candidate.busLeg.route || "Unknown"],
            memberRouteIds: [candidate.route.id],
            commonPolyline: busPoly, // 첫 번째 후보의 polyline을 대표로 사용
            durationRange: [
              candidate.route.totalDurationSeconds,
              candidate.route.totalDurationSeconds,
            ],
          });
        }
      }

      // 3. 멤버가 2개 이상인 그룹만 유효한 오버랩 그룹으로 취급
      const validGroups = overlapGroups.filter(
        (g) => g.memberRouteIds.length > 1,
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
        transits: transResult.status === "fulfilled" ? transResult.value : [],
        overlapGroups: validGroups.length > 0 ? validGroups : undefined,
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
