// src/shared/api/mapbox/isochrone.ts
import ky from "ky";
import { env } from "@/shared/config/env";

export type IsochroneProfile = "walking" | "driving" | "cycling";

export type IsochronePolygon = {
  coordinates: number[][][]; // [ [ [lng, lat], ... ] ]
};

export type IsochroneResponse = {
  polygons: IsochronePolygon[];
  fallbackUsed: boolean;
};

type MapboxIsochroneFeature = {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  properties: {
    contour: number;
    color?: string;
  };
};

type MapboxIsochroneRaw = {
  type: "FeatureCollection";
  features: MapboxIsochroneFeature[];
};

const PROFILE_MAP: Record<IsochroneProfile, string> = {
  walking: "walking",
  driving: "driving",
  cycling: "cycling",
};

export async function fetchIsochroneFromMapbox(
  profile: IsochroneProfile,
  center: { lat: number; lng: number },
  minutes: number,
): Promise<IsochronePolygon[] | null> {
  const baseUrl = "https://api.mapbox.com/isochrone/v1/mapbox";
  const profilePath = PROFILE_MAP[profile];
  const url = `${baseUrl}/${profilePath}/${center.lng},${center.lat}`;

  const searchParams = new URLSearchParams({
    contours_minutes: String(minutes), // 1~60 제약[web:135]
    polygons: "true",
    access_token: env.MAPBOX_ACCESS_TOKEN,
  });

  try {
    const res = await ky
      .get(url, {
        searchParams,
        timeout: 10_000,
      })
      .json<MapboxIsochroneRaw>();

    const polygons: IsochronePolygon[] = res.features.map((f) => ({
      coordinates: f.geometry.coordinates,
    }));

    if (polygons.length === 0) {
      return null;
    }

    return polygons;
  } catch {
    return null;
  }
}
