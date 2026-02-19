import ky from "ky";
import { env } from "@/shared/config/env";
import type { TmapLatLng } from "./types";

export type TmapTransitLegMode = "WALK" | "BUS" | "SUBWAY";

export type TmapTransitLeg = {
  mode: TmapTransitLegMode;
  distanceMeters: number;
  durationSeconds: number;
  polyline: TmapLatLng[];
};

export type TmapTransitRoute = {
  distanceMeters: number;
  durationSeconds: number;
  legs: TmapTransitLeg[];
};

type RawTransitFeatureGeometry = {
  type: string;
  coordinates: number[][] | number[][][];
};

type RawTransitFeatureProperties = {
  distance?: number;
  time?: number;
  moveType?: number; // 1: 도보, 2: 버스, 3: 지하철 등 (TMAP 문서 기준)
  // 필요한 필드는 차차 추가
};

type RawTransitFeature = {
  type: "Feature";
  geometry: RawTransitFeatureGeometry;
  properties: RawTransitFeatureProperties;
};

type RawTransitResponse = {
  type: "FeatureCollection";
  features: RawTransitFeature[];
};

const TMAP_TRANSIT_URL = "https://apis.openapi.sk.com/transit/routes";

function moveTypeToMode(moveType: number | undefined): TmapTransitLegMode {
  if (moveType === 2) return "BUS";
  if (moveType === 3) return "SUBWAY";
  return "WALK";
}

export async function getTransitRoute(
  from: TmapLatLng,
  to: TmapLatLng,
): Promise<TmapTransitRoute | null> {
  const body = {
    startX: from.lng,
    startY: from.lat,
    endX: to.lng,
    endY: to.lat,
    lang: 0,
    format: "json",
    reqCoordType: "WGS84GEO",
    resCoordType: "WGS84GEO",
  };

  try {
    const res = await ky
      .post(TMAP_TRANSIT_URL, {
        headers: {
          "Content-Type": "application/json",
          appKey: env.TMAP_APP_KEY,
        },
        json: body,
        timeout: 10000,
      })
      .json<RawTransitResponse>();

    if (!res.features || res.features.length === 0) return null;

    const legs: TmapTransitLeg[] = [];
    let totalDistance = 0;
    let totalTime = 0;

    for (const feature of res.features) {
      const { properties, geometry } = feature;
      const distanceMeters = properties.distance ?? 0;
      const durationSeconds = properties.time ?? 0;

      totalDistance += distanceMeters;
      totalTime += durationSeconds;

      const mode = moveTypeToMode(properties.moveType);

      const polyline: TmapLatLng[] = [];

      if (geometry.type === "LineString") {
        const coords = geometry.coordinates as number[][];
        coords.forEach(([lng, lat]) => {
          polyline.push({ lat, lng });
        });
      } else if (geometry.type === "MultiLineString") {
        const coords = geometry.coordinates as number[][][];
        coords.forEach((line) => {
          line.forEach(([lng, lat]) => {
            polyline.push({ lat, lng });
          });
        });
      }

      legs.push({
        mode,
        distanceMeters,
        durationSeconds,
        polyline,
      });
    }

    return {
      distanceMeters: totalDistance,
      durationSeconds: totalTime,
      legs,
    };
  } catch {
    return null;
  }
}
