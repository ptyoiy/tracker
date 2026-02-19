// src/shared/lib/geo/isochrone-fallback.ts
import { buffer } from "@turf/turf";
import type {
  IsochronePolygon,
  IsochroneProfile,
} from "@/shared/api/mapbox/isochrone";

const PROFILE_SPEED_KMH: Record<IsochroneProfile, number> = {
  walking: 5,
  driving: 40,
  cycling: 15,
};

// 최소한의 GeoJSON 타입만 직접 정의
type PointGeometry = {
  type: "Point";
  coordinates: [number, number];
};

type PolygonGeometry = {
  type: "Polygon";
  coordinates: number[][][];
};

type PointFeature = {
  type: "Feature";
  geometry: PointGeometry;
  properties: Record<string, unknown>;
};

type PolygonFeature = {
  type: "Feature";
  geometry: PolygonGeometry;
  properties: Record<string, unknown>;
};

export function buildFallbackIsochrone(
  profile: IsochroneProfile,
  center: { lat: number; lng: number },
  minutes: number,
): IsochronePolygon {
  const speedKmh = PROFILE_SPEED_KMH[profile];
  const hours = minutes / 60;
  const distanceKm = speedKmh * hours;

  const point: PointFeature = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [center.lng, center.lat],
    },
    properties: {},
  };

  const buffered = buffer(point, distanceKm, {
    units: "kilometers",
    steps: 32,
  }) as PolygonFeature; // geometry가 Polygon이라고 가정

  const coords = buffered.geometry.coordinates;

  return {
    coordinates: coords,
  };
}
