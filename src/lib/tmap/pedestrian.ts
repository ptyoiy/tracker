// src/lib/tmap/pedestrian.ts
import ky from "ky";

export interface TmapPedestrianRequest {
  startX: number; // 경도
  startY: number; // 위도
  endX: number;
  endY: number;
  startName?: string;
  endName?: string;
}

export interface TmapPedestrianResponse {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "LineString";
      coordinates: number[][]; // [lng, lat]
    };
    properties: {
      totalDistance: number; // 미터
      totalTime: number; // 초
    };
  }>;
}

export async function getTmapPedestrianRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<TmapPedestrianResponse> {
  if (!process.env.TMAP_APP_KEY) {
    throw new Error("TMAP_APP_KEY is not set");
  }
  const response = await ky
    .post<TmapPedestrianRequest>(
      "https://apis.openapi.sk.com/tmap/routes/pedestrian",
      {
        headers: {
          appKey: process.env.TMAP_APP_KEY,
          "Content-Type": "application/json",
        },
        json: {
          startX: from.lng,
          startY: from.lat,
          endX: to.lng,
          endY: to.lat,
          startName: "출발",
          endName: "도착",
          reqCoordType: "WGS84GEO",
          resCoordType: "WGS84GEO",
        },
        timeout: 10000,
      },
    )
    .json<TmapPedestrianResponse>();

  return response;
}
