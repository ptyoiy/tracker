// src/shared/api/tmap/driving.ts

import ky from "ky";
import { env } from "@/shared/config/env";
import type { TmapBasicRouteResponse, TmapLatLng } from "./types";

export type TmapDrivingRoute = {
  distanceMeters: number;
  durationSeconds: number;
  polyline: TmapLatLng[];
};

const TMAP_DRIVING_URL = "https://apis.openapi.sk.com/tmap/routes";

export async function getDrivingRoute(
  from: TmapLatLng,
  to: TmapLatLng,
): Promise<TmapDrivingRoute | null> {
  const body = {
    startX: from.lng,
    startY: from.lat,
    endX: to.lng,
    endY: to.lat,
    reqCoordType: "WGS84GEO",
    resCoordType: "WGS84GEO",
    startName: "start",
    endName: "end",
  };

  try {
    const res = await ky
      .post(TMAP_DRIVING_URL, {
        headers: {
          "Content-Type": "application/json",
          appKey: env.TMAP_APP_KEY,
        },
        json: body,
        timeout: 10000,
      })
      .json<TmapBasicRouteResponse>();

    const firstFeatureProperties = res.features[0]?.properties;
    const totalDistance =
      res.properties?.totalDistance ??
      firstFeatureProperties?.totalDistance ??
      0;
    const totalTime =
      res.properties?.totalTime ?? firstFeatureProperties?.totalTime ?? 0;

    const polyline: TmapLatLng[] = [];

    for (const feature of res.features) {
      if (feature.geometry.type === "LineString") {
        const coords = feature.geometry.coordinates as number[][];
        coords.forEach(([lng, lat]) => {
          polyline.push({ lat, lng });
        });
      }
    }

    if (polyline.length === 0) return null;

    return {
      distanceMeters: totalDistance,
      durationSeconds: totalTime,
      polyline,
    };
  } catch {
    return null;
  }
}
