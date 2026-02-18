// src/features/route-analysis/lib/route-builder.ts

import type { TmapDrivingRoute } from "@/shared/api/tmap/driving";
import type { TmapPedestrianRoute } from "@/shared/api/tmap/pedestrian";
import type {
  TmapTransitLegMode,
  TmapTransitRoute,
} from "@/shared/api/tmap/transit";
import type { TmapLatLng } from "@/shared/api/tmap/types";
import type { RouteInfo, RouteLeg } from "@/types/analyze";

function mapTransitModeToPrimary(
  mode: TmapTransitLegMode,
): "walking" | "transit" | "vehicle" {
  if (mode === "BUS" || mode === "SUBWAY") return "transit";
  return "walking";
}

function buildLegFromPolyline(
  mode: TmapTransitLegMode | "CAR" | "WALK",
  distanceMeters: number,
  durationSeconds: number,
  polyline: TmapLatLng[],
): RouteLeg {
  return {
    mode,
    distanceKm: distanceMeters / 1000,
    durationSeconds,
    polyline: polyline.map((p) => ({ lat: p.lat, lng: p.lng })),
  };
}

export function buildPedestrianRouteInfo(
  id: string,
  route: TmapPedestrianRoute,
): RouteInfo {
  const leg = buildLegFromPolyline(
    "WALK",
    route.distanceMeters,
    route.durationSeconds,
    route.polyline,
  );

  return {
    id,
    totalDistanceKm: route.distanceMeters / 1000,
    totalDurationSeconds: route.durationSeconds,
    legs: [leg],
    primaryMode: "walking",
  };
}

export function buildDrivingRouteInfo(
  id: string,
  route: TmapDrivingRoute,
): RouteInfo {
  const leg = buildLegFromPolyline(
    "CAR",
    route.distanceMeters,
    route.durationSeconds,
    route.polyline,
  );

  return {
    id,
    totalDistanceKm: route.distanceMeters / 1000,
    totalDurationSeconds: route.durationSeconds,
    legs: [leg],
    primaryMode: "vehicle",
  };
}

export function buildTransitRouteInfo(
  id: string,
  route: TmapTransitRoute,
): RouteInfo {
  const legs: RouteLeg[] = route.legs.map((leg) =>
    buildLegFromPolyline(
      leg.mode,
      leg.distanceMeters,
      leg.durationSeconds,
      leg.polyline,
    ),
  );

  const mainLeg =
    legs.find((l) => l.mode === "BUS" || l.mode === "SUBWAY") ?? legs[0];

  const primaryMode = mapTransitModeToPrimary(
    (mainLeg.mode as TmapTransitLegMode) ?? "WALK",
  );

  return {
    id,
    totalDistanceKm: route.distanceMeters / 1000,
    totalDurationSeconds: route.durationSeconds,
    legs,
    primaryMode,
  };
}
