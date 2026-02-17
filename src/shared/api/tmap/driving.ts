import ky from "ky";

export interface TmapDrivingResponse {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "LineString";
      coordinates: number[][];
    };
    properties: {
      totalDistance: number;
      totalTime: number;
    };
  }>;
}

export async function getTmapDrivingRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<TmapDrivingResponse> {
  if (!process.env.TMAP_APP_KEY) {
    throw new Error("TMAP_APP_KEY is not set");
  }

  const response = await ky
    .post("https://apis.openapi.sk.com/tmap/routes", {
      headers: {
        appKey: process.env.TMAP_APP_KEY,
        "Content-Type": "application/json",
      },
      json: {
        startX: from.lng,
        startY: from.lat,
        endX: to.lng,
        endY: to.lat,
        reqCoordType: "WGS84GEO",
        resCoordType: "WGS84GEO",
      },
      timeout: 10000,
    })
    .json<TmapDrivingResponse>();

  return response;
}
