// src/features/cctv-mapping/model/types.ts
export type CCTVDirection =
  | "N"
  | "S"
  | "E"
  | "W"
  | "NE"
  | "NW"
  | "SE"
  | "SW"
  | "UNKNOWN";

export type CCTVSource = "SEOUL_OPEN_DATA" | "ITS" | "OTHER";

export type CCTV = {
  id: string;
  lat: number;
  lng: number;
  direction: CCTVDirection;
  roadName?: string;
  agency?: string;
  source: CCTVSource;
};

export type CCTVFilterContext =
  | { type: "ROUTE"; polyline: [number, number][]; bufferMeters: number }
  | { type: "ISOCHRONE"; polygon: [number, number][][]; bufferMeters?: number }
  | {
      type: "VIEWPORT";
      bounds: { sw: [number, number]; ne: [number, number] };
    };
