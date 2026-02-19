// src/shared/api/tmap/types.ts

export type TmapLatLng = {
  lat: number;
  lng: number;
};

export type TmapRouteSummary = {
  distance: number; // m
  duration: number; // sec
};

export type TmapFeatureGeometry = {
  type: string;
  coordinates: number[][] | number[][][];
};

export type TmapFeatureProperties = {
  // 공통적으로 쓰는 필드만 정의
  distance?: number;
  time?: number;
  // transit용
  index?: number;
  lineName?: string;
  // 기타 필요한 필드가 생기면 여기에 추가
};

export type TmapFeature = {
  type: "Feature";
  geometry: TmapFeatureGeometry;
  properties: TmapFeatureProperties;
};

export type TmapGeoJsonResponse = {
  type: "FeatureCollection";
  features: TmapFeature[];
};

export type TmapBasicRouteResponse = {
  type: "FeatureCollection";
  features: TmapFeature[];
  properties?: {
    totalDistance?: number; // m
    totalTime?: number; // sec
  };
};
