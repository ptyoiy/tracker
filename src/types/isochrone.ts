// src/types/isochrone.ts
import type { LatLng } from "./common";

// Isochrone API
export type IsochroneProfile = "walking" | "driving" | "cycling";

export type IsochroneRequest = LatLng & {
  minutes: number;
  profile: IsochroneProfile;
};

// Mapbox Isochrone GeoJSON 일부만 사용
export type IsochronePolygon = {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: [number, number][][]; // [lng, lat][]
  };
  properties: {
    contour: number;
    color: string;
  };
};

export type IsochroneResponse = {
  type: "FeatureCollection";
  features: IsochronePolygon[];
  fallbackUsed?: boolean;
};
