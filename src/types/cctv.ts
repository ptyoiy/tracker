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

export type RawCctvItem = {
  CAM_CNTOM: string;
  CAM_PIXEL_CNT: string;
  DAT_CRTR_YMD: string;
  INSTL_PRPS_SE_NM: string;
  INSTL_YM: string;
  KPNG_DAY_CNT: string;
  LAST_MDFCN_PNT: string;
  LCTN_LOTNO_ADDR: string;
  LCTN_ROAD_NM_ADDR: string;
  MNG_INST_NM: string;
  MNG_INST_TELNO: string;
  MNG_NO: string;
  OPN_ATMY_GRP_CD: string;
  SHT_ANGLE_INFO: string;
  WGS84_LAT: string;
  WGS84_LOT: string;
};

export type CctvRow = {
  id: string;
  purpose: string | null;
  lot_address: string | null;
  road_address: string | null;
  manager_name: string | null;
  org_code: string | null;
  shot_angle: string | null;
  lat: number;
  lng: number;
};
