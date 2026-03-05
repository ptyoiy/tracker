import { getDistanceKm } from "@/shared/lib/geo/distance";
import type { HotspotSegment, RouteInfo, TransportMode } from "@/types/analyze";
import type { Observation } from "@/types/observation";
import * as turf from "@turf/turf";

const RESAMPLE_INTERVAL_M = 30; // 30m
const PROXIMITY_THRESHOLD_KM = 0.05; // 50m
const COVERAGE_THRESHOLD = 0.5; // 50%
const MAX_HOTSPOT_LENGTH_M = 350; // 350m

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

  // 1. Resample all routes
  const allPoints: ResampledPoint[] = [];
  const routePointsMap = new Map<string, ResampledPoint[]>();

  for (const route of candidateRoutes) {
    // Combine all leg polylines
    const fullPolyline: { lat: number; lng: number }[] = [];
    for (const leg of route.legs) {
      if (fullPolyline.length > 0 && leg.polyline.length > 0) {
        // avoid duplicating the connection point if exact match
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
    allPoints.push(...pts);
    routePointsMap.set(route.id, pts);
  }

  // 2. Cross-compare to find coverage
  // O(N^2) where N is total points
  for (let i = 0; i < allPoints.length; i++) {
    const p1 = allPoints[i];
    for (let j = i + 1; j < allPoints.length; j++) {
      const p2 = allPoints[j];
      if (p1.routeId === p2.routeId) continue;

      const dist = getDistanceKm(p1, p2);
      if (dist <= PROXIMITY_THRESHOLD_KM) {
        p1.coveredRoutes.add(p2.routeId);
        p2.coveredRoutes.add(p1.routeId);
      }
    }
    const coverageRatio = p1.coveredRoutes.size / totalRouteCount;
    if (coverageRatio >= COVERAGE_THRESHOLD) {
      p1.isHot = true;
    }
  }

  // 3. Extract continuous hot segments
  type CandHotspot = {
    polyline: { lat: number; lng: number }[];
    coveredRouteIds: Set<string>;
    modes: Set<TransportMode>;
    lengthMeters: number;
    anchorPoint: { lat: number; lng: number };
  };

  const candidateHotspots: CandHotspot[] = [];

  for (const [_routeId, pts] of routePointsMap.entries()) {
    let currentHotSegment: ResampledPoint[] = [];

    const flush = () => {
      // Must have at least 2 points to form a line
      if (currentHotSegment.length >= 2) {
        const poly = currentHotSegment.map((p) => ({ lat: p.lat, lng: p.lng }));
        const line = turf.lineString(poly.map((p) => [p.lng, p.lat]));
        const lenMeters = turf.length(line, { units: "kilometers" }) * 1000;

        // Skip segments that are too short to be meaningful
        if (lenMeters >= 50) {
          const covered = new Set<string>();
          const modes = new Set<TransportMode>();
          for (const p of currentHotSegment) {
            for (const r of p.coveredRoutes) covered.add(r);
            for (const m of p.modes) modes.add(m);
          }

          // Anchor point: point matching observation
          let minObsDist = Number.MAX_VALUE;
          let anchor = poly[0];
          for (const p of poly) {
            const d = getDistanceKm(p, fromObs);
            if (d < minObsDist) {
              minObsDist = d;
              anchor = p;
            }
          }

          candidateHotspots.push({
            polyline: poly,
            coveredRouteIds: covered,
            modes,
            lengthMeters: lenMeters,
            anchorPoint: anchor,
          });
        }
      }
      currentHotSegment = [];
    };

    for (const p of pts) {
      if (p.isHot) {
        currentHotSegment.push(p);
      } else {
        flush();
      }
    }
    flush();
  }

  // 4. Deduplicate candidate hotspots
  // Sort by length descending, so we keep the most complete representations
  candidateHotspots.sort((a, b) => b.lengthMeters - a.lengthMeters);

  const finalHotspots: CandHotspot[] = [];

  for (const cand of candidateHotspots) {
    // Check if cand overlaps significantly with any already selected final hotspot
    let isDuplicate = false;
    for (const finalCand of finalHotspots) {
      // Simple heuristic: if cand's midpoint is near finalCand
      const candMidIdx = Math.floor(cand.polyline.length / 2);
      const candMid = cand.polyline[candMidIdx];

      // check distance from candMid to finalCand polyline
      let minDist = Number.MAX_VALUE;
      for (const p of finalCand.polyline) {
        const d = getDistanceKm(candMid, p);
        if (d < minDist) minDist = d;
      }

      if (minDist <= PROXIMITY_THRESHOLD_KM) {
        isDuplicate = true;
        // 중복인 경우 단순 스킵 (머지하지 않음)
        break;
      }
    }

    if (!isDuplicate) {
      finalHotspots.push(cand);
    }
  }

  // 5. Split long hotspots into chunks
  const splitHotspots: HotspotSegment[] = [];

  for (const hot of finalHotspots) {
    const line = turf.lineString(hot.polyline.map((p) => [p.lng, p.lat]));
    const lenKm = hot.lengthMeters / 1000;

    let chunks = 1;
    if (hot.lengthMeters > MAX_HOTSPOT_LENGTH_M) {
      chunks = Math.ceil(hot.lengthMeters / MAX_HOTSPOT_LENGTH_M);
    }

    const chunkLenKm = lenKm / chunks;

    for (let c = 0; c < chunks; c++) {
      const startDist = c * chunkLenKm;
      const endDist = (c + 1) * chunkLenKm;

      const subLine = turf.lineSliceAlong(line, startDist, endDist, {
        units: "kilometers",
      });
      const coords = subLine.geometry.coordinates;
      const subPoly = coords.map((c) => ({ lat: c[1], lng: c[0] }));

      if (subPoly.length < 2) continue;

      let minObsDist = Number.MAX_VALUE;
      let anchor = subPoly[0];
      for (const p of subPoly) {
        const d = getDistanceKm(p, fromObs);
        if (d < minObsDist) {
          minObsDist = d;
          anchor = p;
        }
      }

      splitHotspots.push({
        id: crypto.randomUUID(),
        segmentId,
        polyline: subPoly,
        anchorPoint: anchor,
        coveredRouteIds: Array.from(hot.coveredRouteIds),
        coverageRatio: hot.coveredRouteIds.size / totalRouteCount,
        lengthMeters: turf.length(subLine, { units: "kilometers" }) * 1000,
        modes: Array.from(hot.modes) as TransportMode[],
      });
    }
  }

  return splitHotspots;
}
