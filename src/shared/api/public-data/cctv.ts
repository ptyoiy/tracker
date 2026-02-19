// src/shared/api/public-data/cctv.ts
import ky from "ky";
import { coordToAddress } from "@/shared/api/kakao/geocoder";
import type { CCTV } from "@/types/cctv";
import { findOpenAtmyCodeByAddress } from "./open-atmy-grp";

// src/shared/api/public-data/cctv.ts

type CctvApiItem = {
  MNG_NO: string;
  ING_INST_NM?: string;
  LCTN_ROAD_NM_ADDR?: string;
  WGS84_LAT?: string;
  WGS84_LOT?: string;
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

export async function fetchCctvInBounds(
  bounds: CctvBounds,
  page: number = 1,
  numOfRows: number = 100,
): Promise<CCTV[]> {
  const { sw, ne } = bounds;

  const centerLat = (sw.lat + ne.lat) / 2;
  const centerLng = (sw.lng + ne.lng) / 2;

  const centerAddress = await coordToAddress(centerLat, centerLng);
  const opnCode = centerAddress
    ? await findOpenAtmyCodeByAddress(centerAddress)
    : null;
  console.log({ centerAddress, opnCode });
  const searchParams = new URLSearchParams({
    pageNo: String(page),
    numOfRows: String(numOfRows),
  });
  if (opnCode) searchParams.set("opnCode", opnCode);

  // ✅ 이제는 우리 서버의 /api/cctv만 호출
  const res = await ky.get<CctvApiResponse>(
    `/api/cctv?${searchParams.toString()}`,
  );
  const raw = await res.json();
  if (raw.response.header.resultCode !== "0") {
    throw new Error(
      `CCTV API error: ${raw.response.header.resultCode} ${raw.response.header.resultMsg}`,
    );
  }
  // items가 객체 단일/배열/null로 올 수 있는 경우 모두 처리
  const body = raw.response.body;
  const itemsArray: CctvApiItem[] = body.items.item || [];

  const cctvs: CCTV[] = itemsArray
    .map((item) => {
      const lat = parseFloat(item.WGS84_LAT ?? "");
      const lng = parseFloat(item.WGS84_LOT ?? "");
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

      if (!(lat >= sw.lat && lat <= ne.lat && lng >= sw.lng && lng <= ne.lng)) {
        return null;
      }

      return {
        id: item.MNG_NO,
        lat,
        lng,
        direction: "UNKNOWN",
        roadName: item.LCTN_ROAD_NM_ADDR,
        agency: item.ING_INST_NM,
        source: "SEOUL_OPEN_DATA",
      } as CCTV;
    })
    .filter((v): v is CCTV => v !== null);

  return cctvs;
}
