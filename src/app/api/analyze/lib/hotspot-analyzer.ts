import { getDistanceKm } from "@/shared/lib/geo/distance";
import type { HotspotSegment, RouteInfo, TransportMode } from "@/types/analyze";
import type { Observation } from "@/types/observation";
import * as turf from "@turf/turf";

const RESAMPLE_INTERVAL_M = 30; // 30m
const PROXIMITY_THRESHOLD_KM = 0.05; // 50m

type ResampledPoint = {
  lat: number;
  lng: number;
  routeId: string;
  seq: number;
  modes: TransportMode[];
  isHot: boolean;
  coveredRoutes: Set<string>;
};

function resamplePolyline(
  polyline: { lat: number; lng: number }[],
  routeId: string,
  modes: TransportMode[],
): ResampledPoint[] {
  if (polyline.length < 2) return [];

  const line = turf.lineString(polyline.map((p) => [p.lng, p.lat]));
  const lenKm = turf.length(line, { units: "kilometers" });
  const intervalKm = RESAMPLE_INTERVAL_M / 1000;

  const resampled: ResampledPoint[] = [];
  let seq = 0;
  for (let d = 0; d <= lenKm; d += intervalKm) {
    const p = turf.along(line, d, { units: "kilometers" });
    resampled.push({
      lat: p.geometry.coordinates[1],
      lng: p.geometry.coordinates[0],
      routeId,
      seq: seq++,
      modes,
      isHot: false,
      coveredRoutes: new Set([routeId]),
    });
  }
  // Include exact end point
  if (lenKm % intervalKm !== 0) {
    const last = polyline[polyline.length - 1];
    resampled.push({
      lat: last.lat,
      lng: last.lng,
      routeId,
      seq: seq++,
      modes,
      isHot: false,
      coveredRoutes: new Set([routeId]),
    });
  }
  return resampled;
}

export function extractHotspots(
  candidateRoutes: RouteInfo[],
  fromObs: Observation,
  segmentId: string,
): HotspotSegment[] {
  const totalRouteCount = candidateRoutes.length;
  if (totalRouteCount < 2) return [];

  // 각 노선의 정밀한 궤적 점들을 추출
  const routePointsMap = new Map<string, ResampledPoint[]>();
  for (const route of candidateRoutes) {
    const fullPolyline: { lat: number; lng: number }[] = [];
    for (const leg of route.legs) {
      if (fullPolyline.length > 0 && leg.polyline.length > 0) {
        const last = fullPolyline[fullPolyline.length - 1];
        const first = leg.polyline[0];
        if (last.lat === first.lat && last.lng === first.lng) {
          fullPolyline.push(...leg.polyline.slice(1));
        } else {
          fullPolyline.push(...leg.polyline);
        }
      } else {
        fullPolyline.push(...leg.polyline);
      }
    }
    const pts = resamplePolyline(fullPolyline, route.id, [route.primaryMode]);
    routePointsMap.set(route.id, pts);
  }

  type CandHotspot = {
    polyline: { lat: number; lng: number }[];
    coveredRouteIds: Set<string>;
    modes: Set<TransportMode>;
    lengthMeters: number;
    anchorPoint: { lat: number; lng: number };
  };

  const finalHotspots: CandHotspot[] = [];

  // 1번 노선을 기준으로 다른 노선들과 비교하며 공통 구간(교집합)을 연속적으로 잘라냄
  // 모든 조합을 체크하여 순수 중복 구간들을 찾음
  const baseRoute = candidateRoutes[0];
  const basePts = routePointsMap.get(baseRoute.id) || [];

  // 모든 다른 노선들에 대해, baseRoute와 겹치는 "연속된 점들" 구간을 찾음
  for (let i = 1; i < candidateRoutes.length; i++) {
    const candRoute = candidateRoutes[i];
    const candPts = routePointsMap.get(candRoute.id) || [];

    let currentSegment: ResampledPoint[] = [];

    const flushSegment = () => {
      if (currentSegment.length >= 2) {
        const poly = currentSegment.map((p) => ({ lat: p.lat, lng: p.lng }));
        const line = turf.lineString(poly.map((p) => [p.lng, p.lat]));
        const lenMeters = turf.length(line, { units: "kilometers" }) * 1000;

        // 의미 있는 길이의 교집합 구간만 추출 (50m 이상 혹은 점 3개 이상)
        if (lenMeters >= 30) {
          const covered = new Set<string>();
          covered.add(baseRoute.id);
          covered.add(candRoute.id);
          const modes = new Set<TransportMode>();
          modes.add(baseRoute.primaryMode);
          modes.add(candRoute.primaryMode);

          let minObsDist = Number.MAX_VALUE;
          let anchor = poly[0];
          for (const p of poly) {
            const d = getDistanceKm(p, fromObs);
            if (d < minObsDist) {
              minObsDist = d;
              anchor = p;
            }
          }

          finalHotspots.push({
            polyline: poly,
            coveredRouteIds: covered,
            modes,
            lengthMeters: lenMeters,
            anchorPoint: anchor,
          });
        }
      }
      currentSegment = [];
    };

    for (const bPt of basePts) {
      // 해당 베이스 점이 candPts와 인접한지 확인
      let isNear = false;
      for (const cPt of candPts) {
        if (getDistanceKm(bPt, cPt) <= PROXIMITY_THRESHOLD_KM) {
          isNear = true;
          break;
        }
      }

      if (isNear) {
        currentSegment.push(bPt);
      } else {
        flushSegment();
      }
    }
    flushSegment();
  }

  // 이제 추출된 원시(Raw) 교집합 구간들에 대해, 나머지 노선들이 여기 속하는지 다시 채점
  // 중복이 심한 교집합 덩어리가 여러 개 나올 수 있으므로, 최종 통합.
  const mergedHotspots: HotspotSegment[] = [];

  for (const hot of finalHotspots) {
    const subPoly = hot.polyline;
    if (subPoly.length < 2) continue;

    const chunkCoveredRoutes = new Set<string>(hot.coveredRouteIds);
    const chunkModes = new Set<TransportMode>(hot.modes);

    for (const candRoute of candidateRoutes) {
      if (chunkCoveredRoutes.has(candRoute.id)) continue;

      const candPts = routePointsMap.get(candRoute.id) || [];
      let matchCount = 0;

      for (const sp of subPoly) {
        let isNear = false;
        for (const cp of candPts) {
          if (getDistanceKm(sp, cp) <= PROXIMITY_THRESHOLD_KM) {
            isNear = true;
            break;
          }
        }
        if (isNear) matchCount++;
      }

      // 이 순수 중복 구간 위에 해당 노선이 대부분(80% 이상) 겹친다면 이 핫스팟의 포함 노선으로 인정
      if (matchCount >= subPoly.length * 0.8) {
        chunkCoveredRoutes.add(candRoute.id);
        chunkModes.add(candRoute.primaryMode);
      }
    }

    let minObsDist = Number.MAX_VALUE;
    let anchor = subPoly[0];
    for (const p of subPoly) {
      const d = getDistanceKm(p, fromObs);
      if (d < minObsDist) {
        minObsDist = d;
        anchor = p;
      }
    }

    // 중복 방지: 이미 거의 동일한 핫스팟이 merged 쪽에 돌고 있다면 스킵 (혹은 루트 추가)
    const midIdx = Math.floor(subPoly.length / 2);
    const midPt = subPoly[midIdx];

    let isDuplicate = false;
    for (const existing of mergedHotspots) {
      // 기존 핫스팟의 바운더리 내에 현재 미드포인트가 있고, 커버된 라우트 셋이 비슷하다면
      // (중복 선분 방지)
      let isMidNear = false;
      for (const ep of existing.polyline) {
        if (getDistanceKm(midPt, ep) <= PROXIMITY_THRESHOLD_KM) {
          isMidNear = true;
          break;
        }
      }

      if (isMidNear) {
        // 기존 핫스팟에 라우트들을 병합하고 스킵 (가장 짧은 중복구간을 채택하는 효과)
        for (const r of chunkCoveredRoutes) {
          if (!existing.coveredRouteIds.includes(r))
            existing.coveredRouteIds.push(r);
        }
        existing.coverageRatio =
          existing.coveredRouteIds.length / totalRouteCount;
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate && chunkCoveredRoutes.size >= 2) {
      mergedHotspots.push({
        id: crypto.randomUUID(),
        segmentId,
        polyline: subPoly,
        anchorPoint: anchor,
        coveredRouteIds: Array.from(chunkCoveredRoutes),
        coverageRatio: chunkCoveredRoutes.size / totalRouteCount,
        lengthMeters: hot.lengthMeters,
        modes: Array.from(chunkModes),
      });
    }
  }

  // ---------------------------------------------------------
  // 3. 차집합(Subtraction) 라우팅 로직 추가
  // 상호 배타적인(Mutually Exclusive) 핫스팟 추출을 위해,
  // 중복도(coverageRatio)가 가장 높은 핫스팟이 선형 구간을 독점하고,
  // 중복도가 낮은 핫스팟들은 그 구간을 뺀 나머지 유니크한 자기만의 길만 갖도록 궤적을 자름.
  // ---------------------------------------------------------

  mergedHotspots.sort((a, b) => b.coverageRatio - a.coverageRatio);

  const exclusiveHotspots: HotspotSegment[] = [];

  for (const currentHot of mergedHotspots) {
    let currentSections: Array<{ lat: number; lng: number }[]> = [
      currentHot.polyline,
    ];

    for (const higherHot of exclusiveHotspots) {
      const nextSections: Array<{ lat: number; lng: number }[]> = [];

      for (const section of currentSections) {
        let currentSubSection: { lat: number; lng: number }[] = [];

        const flushSubSection = () => {
          if (currentSubSection.length >= 2) {
            nextSections.push([...currentSubSection]);
          }
          currentSubSection = [];
        };

        for (const pt of section) {
          // 상위 핫스팟 선분들과 얼마나 가까운지 검사
          let isOverlapping = false;
          for (const hPt of higherHot.polyline) {
            if (getDistanceKm(pt, hPt) <= PROXIMITY_THRESHOLD_KM) {
              isOverlapping = true;
              break;
            }
          }

          if (isOverlapping) {
            // 겹치면 여기서 잘라냄
            flushSubSection();
          } else {
            // 안 겹치면 계속 이어붙임
            currentSubSection.push(pt);
          }
        }
        flushSubSection();
      }
      currentSections = nextSections;
    }

    // 잘려나간 후 남은 유효한 조각들만 새로운 핫스팟 객체로 등록
    for (const section of currentSections) {
      if (section.length >= 2) {
        const line = turf.lineString(section.map((p) => [p.lng, p.lat]));
        const lenMeters = turf.length(line, { units: "kilometers" }) * 1000;

        // 조각의 길이가 너무 짧으면 폐기 (예약된 30m보다 짧거나, 너무 자잘한 찌꺼기일 확률)
        // 화면에서 마커를 식별하고 누르려면 최소 30m~50m는 필요. 여기선 20m로 약간 여유를 둠.
        if (lenMeters >= 20) {
          let minObsDist = Number.MAX_VALUE;
          let anchor = section[0];
          for (const p of section) {
            const d = getDistanceKm(p, fromObs);
            if (d < minObsDist) {
              minObsDist = d;
              anchor = p;
            }
          }

          exclusiveHotspots.push({
            ...currentHot,
            id: crypto.randomUUID(), // 분할될 수 있으므로 새 ID 발급
            polyline: section,
            lengthMeters: lenMeters,
            anchorPoint: anchor,
          });
        }
      }
    }
  }

  return exclusiveHotspots;
}
