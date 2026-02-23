// src/shared/api/public-data/cctv.ts
import ky from "ky";
import type { CCTV } from "@/types/cctv";

// src/shared/api/public-data/cctv.ts

type CctvApiItem = {
  MNG_NO: string;
  MNG_INST_NM?: string;
  LCTN_ROAD_NM_ADDR?: string;
  WGS84_LAT?: string;
  WGS84_LOT?: string;
  INSTL_PRPS_SE_NM?: string;
  SHT_ANGLE_INFO?: string;
};

type CctvApiResponse = {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      items: {
        item: CctvApiItem[] | null;
      };
      pageNo: number;
      numOfRows: number;
      totalCount: number;
    };
  };
};

export type CctvBounds = {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
};

export async function syncRegionCctv(orgCode: string) {
  const res = await ky.post("/api/cctv/sync-region", {
    json: { orgCode },
    timeout: 60000, // Syncing can take time
  });
  return res.json();
}

export async function fetchCctvInBounds(
  bounds: CctvBounds,
  opnCode?: string | null,
): Promise<CCTV[]> {
  const { sw, ne } = bounds;

  const searchParams = new URLSearchParams();
  if (opnCode) {
    searchParams.set("opnCode", opnCode);
  } else {
    // If no opnCode provided, we can fetch by bbox
    searchParams.set("minLat", String(sw.lat));
    searchParams.set("maxLat", String(ne.lat));
    searchParams.set("minLng", String(sw.lng));
    searchParams.set("maxLng", String(ne.lng));
  }

  const res = await ky.get(`/api/cctv?${searchParams.toString()}`);
  const raw = await res.json<CctvApiResponse>();

  if (raw.response.header.resultCode !== "0") {
    throw new Error(
      `CCTV API error: ${raw.response.header.resultCode} ${raw.response.header.resultMsg}`,
    );
  }

  const body = raw.response.body;
  const itemsArray: CctvApiItem[] = body.items.item || [];

  const cctvs: CCTV[] = itemsArray
    .map((item) => {
      const lat = parseFloat(item.WGS84_LAT ?? "");
      const lng = parseFloat(item.WGS84_LOT ?? "");
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

      // Even if fetched by orgCode, we might want to filter by bounds on client if needed,
      // but usually the server can handle it if we pass bbox.
      // If we only passed opnCode, we should filter here if we want strictly what's in viewport.
      if (!(lat >= sw.lat && lat <= ne.lat && lng >= sw.lng && lng <= ne.lng)) {
        return null;
      }

      return {
        id: item.MNG_NO,
        lat,
        lng,
        direction: item.SHT_ANGLE_INFO || "UNKNOWN",
        purpose: item.INSTL_PRPS_SE_NM || "알 수 없음",
        roadName: item.LCTN_ROAD_NM_ADDR,
        agency: item.MNG_INST_NM,
        source: "SEOUL_OPEN_DATA",
      } as CCTV;
    })
    .filter((v): v is CCTV => v !== null);

  return cctvs;
}
