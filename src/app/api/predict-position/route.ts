import {
  calculateConfidenceScores,
  type HypothesisRawData,
} from "@/features/position-prediction/lib/confidence-scorer";
import { DestinationPredictor } from "@/features/position-prediction/lib/destination-predictor";
import { KalmanEstimator } from "@/features/position-prediction/lib/kalman-estimator";
import { projectPositionByTime } from "@/features/position-prediction/lib/route-projector";
import { PREDICTION_CONFIG } from "@/shared/config/prediction";
import type { PredictionHypothesis, TransportMode } from "@/types/prediction";
import { getDistance } from "geolib";
import { type NextRequest, NextResponse } from "next/server";
import {
  PredictPositionRequestSchema,
  type PredictPositionResponse,
} from "./schema";

// TMAP APIs
import { getDrivingRoute } from "@/shared/api/tmap/driving";
import { getPedestrianRoute } from "@/shared/api/tmap/pedestrian";
import { getTransitRoute } from "@/shared/api/tmap/transit";
import type { TmapLatLng } from "@/shared/api/tmap/types";

import * as turf from "@turf/turf";

// 폴리곤을 방향 비대칭(타원형)으로 생성하기 위한 유틸리티 함수
function createDirectionalPolygon(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
  bearing: number,
): GeoJSON.Polygon {
  const centerPoint = turf.point([centerLng, centerLat]);
  // 1. 기본 원형 버퍼 생성 (turf.circle)
  const options: { steps: number; units: turf.Units } = {
    steps: 36,
    units: "meters" as const,
  };
  const circle = turf.circle(centerPoint, radiusMeters, options);

  // 2. 타원형 만들기 (진행 방향으로 길고 옆으로는 좁은 비대칭)
  const scaledCoords = circle.geometry.coordinates[0].map((coord) => {
    const pt = turf.point(coord);
    const dist = turf.distance(centerPoint, pt, { units: "meters" });
    const currentBearing = turf.bearing(centerPoint, pt);

    // 진행 방향(bearing)과 현재 점의 각도 차이
    let angleDiff = Math.abs(currentBearing - bearing);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;

    // 진행 방향일수록 길게(1.2), 직각일수록 짧게(0.6), 반대 방향일수록 매우 짧게(0.3)
    let factor = 1.0;
    if (angleDiff <= 90) {
      factor = 1.2 - 0.6 * (angleDiff / 90);
    } else {
      factor = 0.6 - 0.3 * ((angleDiff - 90) / 90);
    }

    const newPt = turf.destination(centerPoint, dist * factor, currentBearing, {
      units: "meters",
    });
    return newPt.geometry.coordinates;
  });

  return { type: "Polygon", coordinates: [scaledCoords] };
}

function formatTmapTime(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = PredictPositionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid Request", details: parsed.error },
        { status: 400 },
      );
    }

    const { observations, futureMinutes, currentTime } = parsed.data;

    if (observations.length < PREDICTION_CONFIG.MIN_OBSERVATIONS) {
      return NextResponse.json(
        { error: "Insufficient observations" },
        { status: 400 },
      );
    }

    // 시간 계산
    const currentMs = new Date(currentTime).getTime();
    const lastObs = observations[observations.length - 1];
    const firstObs = observations[0];
    const lastObsMs = new Date(lastObs.timestamp).getTime();

    // 경과 시간 (마지막 관측 ~ 미래 목표 시간)
    const futureMs = currentMs + futureMinutes * 60000;
    const futureIso = new Date(futureMs).toISOString();

    const elapsedSecondsSinceLastObs = Math.max(
      0,
      (futureMs - lastObsMs) / 1000,
    );
    // 첫 관측 ~ 마지막 관측
    const observedDurationSec = Math.max(
      1,
      (lastObsMs - new Date(firstObs.timestamp).getTime()) / 1000,
    );
    const observedDistanceM = getDistance(
      { latitude: firstObs.lat, longitude: firstObs.lng },
      { latitude: lastObs.lat, longitude: lastObs.lng },
    );
    // 기본 구간 평균 속도 (km/h)
    const baseAvgSpeedKmh = (observedDistanceM / observedDurationSec) * 3.6;

    const modes: TransportMode[] = ["walking", "vehicle", "transit"];
    const hypothesesRawData: HypothesisRawData[] = [];
    const generatedHypotheses: PredictionHypothesis[] = [];

    const origin: TmapLatLng = { lat: lastObs.lat, lng: lastObs.lng };
    const destPredictor = new DestinationPredictor();

    for (let i = 0; i < modes.length; i++) {
      const mode = modes[i];

      // 칼만 필터 예측으로 이론적 목표 지점 선정 (API 호출용)
      const estimator = new KalmanEstimator(mode);
      for (const obs of observations) {
        estimator.update(obs.lat, obs.lng, obs.timestamp);
      }

      // 목표 지점은 현재 지정된 미래 예측 시간보다 넉넉하게 30분 이상 더 간 위치로 가정 (TMAP 경로 검색용 가상 목적지)
      const dummyDestinationMs = lastObsMs + (futureMinutes + 30) * 60000;
      const { position: dummyDest } = estimator.predictFuture(
        new Date(dummyDestinationMs).toISOString(),
      );
      const destination: TmapLatLng = { lat: dummyDest[0], lng: dummyDest[1] };

      let hasRoute = false;
      let estimatedTimeSec = 0;
      let routePolyline: TmapLatLng[] = [];
      let projectedPoint: TmapLatLng | null = null;
      let transitLineName = "";

      try {
        if (mode === "walking") {
          const route = await getPedestrianRoute(origin, destination);
          if (route && route.polyline.length > 0) {
            hasRoute = true;
            estimatedTimeSec = route.durationSeconds;
            routePolyline = route.polyline;
          }
        } else if (mode === "vehicle") {
          const route = await getDrivingRoute(origin, destination);
          if (route && route.polyline.length > 0) {
            hasRoute = true;
            estimatedTimeSec = route.durationSeconds;
            routePolyline = route.polyline;
          }
        } else if (mode === "transit") {
          const timeStr = formatTmapTime(lastObs.timestamp);
          const routes = await getTransitRoute(origin, destination, timeStr);
          if (routes && routes.length > 0) {
            // 가장 빠른 경로 선택
            const bestRoute = routes.sort(
              (a, b) => a.durationSeconds - b.durationSeconds,
            )[0];
            hasRoute = true;
            estimatedTimeSec = bestRoute.durationSeconds;
            routePolyline = bestRoute.legs.flatMap((leg) => leg.polyline);

            // 첫 탑승 구간 수집
            const boardLeg = bestRoute.legs.find(
              (l) => l.mode === "BUS" || l.mode === "SUBWAY",
            );
            if (boardLeg) {
              transitLineName = boardLeg.route || "";
            }
          }
        }
      } catch (e) {
        console.error(`TMAP Api error for mode ${mode}:`, e);
      }

      // 경로가 있으면 경로 위 투영, 없으면 칼만 필터 예측 직접 사용 (fallback)
      if (hasRoute && routePolyline.length > 0) {
        // 속도는 실제 관측 베이스 + 각 모드별 특성 보정
        let simSpeed = baseAvgSpeedKmh;
        if (simSpeed < 1) simSpeed = PREDICTION_CONFIG.SPEED_RANGES[mode].avg;

        projectedPoint = projectPositionByTime(
          routePolyline,
          simSpeed,
          elapsedSecondsSinceLastObs,
        );
      }

      const kalmanState = estimator.getState();

      if (!projectedPoint) {
        const kalmanFuture = estimator.predictFuture(futureIso);
        projectedPoint = {
          lat: kalmanFuture.position[0],
          lng: kalmanFuture.position[1],
        };
      }

      // 진행 방향 계산 (속도 벡터 기반)
      let bearing = 0;
      const [vx, vy] = kalmanState.velocity;
      if (vx !== 0 || vy !== 0) {
        bearing = turf.bearing(
          turf.point([lastObs.lng, lastObs.lat]),
          turf.point([projectedPoint.lng, projectedPoint.lat]),
        );
      }

      // 경로가 있었으면 마지막 관측지점부터 projectedPoint까지의 방향을 다시 계산
      if (
        hasRoute &&
        projectedPoint &&
        (projectedPoint.lat !== lastObs.lat ||
          projectedPoint.lng !== lastObs.lng)
      ) {
        bearing = turf.bearing(
          turf.point([lastObs.lng, lastObs.lat]),
          turf.point([projectedPoint.lng, projectedPoint.lat]),
        );
      }

      // 기록 (Scoring 용)
      hypothesesRawData.push({
        mode,
        avgSpeedKmh: baseAvgSpeedKmh,
        hasRoute,
        estimatedTimeSec,
        actualTimeSec: observedDurationSec, // 전체 관측 구간에 대한 시간 (근사)
        hasTransitMatch: false, // TODO: transit-nearby 연동 시 개선
      });

      const baseRadius =
        PREDICTION_CONFIG.UNCERTAINTY_GROWTH[mode] * (futureMinutes || 5);

      // 목적지 예측 (bearing 활용)
      const destinations = await destPredictor.predictDestinations({
        currentLat: projectedPoint.lat,
        currentLng: projectedPoint.lng,
        bearing,
        searchRadiusKm: baseRadius / 1000,
        mode,
      });
      const topDestination =
        destinations.length > 0 ? destinations[0] : undefined;

      const hypothesis: PredictionHypothesis = {
        id: `hyp_${mode}_${i}`,
        mode,
        probability: 0, // 계산 후 세팅
        currentPosition: { lat: projectedPoint.lat, lng: projectedPoint.lng },
        confidenceZone: {
          high: createDirectionalPolygon(
            projectedPoint.lat,
            projectedPoint.lng,
            baseRadius * 0.5,
            bearing,
          ),
          medium: createDirectionalPolygon(
            projectedPoint.lat,
            projectedPoint.lng,
            baseRadius * 1.0,
            bearing,
          ),
          low: createDirectionalPolygon(
            projectedPoint.lat,
            projectedPoint.lng,
            baseRadius * 1.5,
            bearing,
          ),
        },
        metadata: {
          avgSpeed: baseAvgSpeedKmh,
          lastObservedTime: lastObs.timestamp,
          predictionTime: futureIso,
          elapsedMinutes: futureMinutes,
        },
      };

      if (routePolyline.length > 0) {
        hypothesis.routeGeometry = {
          type: "LineString",
          coordinates: routePolyline.map((p) => [p.lng, p.lat]),
        };
      }

      if (topDestination) {
        hypothesis.estimatedDestination = {
          id: topDestination.id,
          name: topDestination.name,
          lat: topDestination.lat,
          lng: topDestination.lng,
          probability: topDestination.probability,
        };
      }

      if (mode === "transit" && transitLineName) {
        hypothesis.transitDetails = {
          lineId: "unknown",
          lineName: transitLineName,
          fromStation: "unknown",
          toStation: "unknown",
          currentSegment: [0, 0],
        };
      }

      generatedHypotheses.push(hypothesis);
    }

    // 신뢰도 계산 및 반영
    const scores = calculateConfidenceScores(hypothesesRawData);
    generatedHypotheses.forEach((hyp) => {
      hyp.probability = scores.get(hyp.mode) || 0;
    });

    const response: PredictPositionResponse = {
      hypotheses: generatedHypotheses.sort(
        (a, b) => b.probability - a.probability,
      ),
      timestamp: new Date().toISOString(),
      inputObservations: observations,
      futureMinutes,
      status: "success",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Position prediction API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
