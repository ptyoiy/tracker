import ky from "ky";
import { env } from "@/shared/config/env";

export type BusRouteInfoRaw = {
  busRouteId: string;
  busRouteNm: string;
  edStationNm: string;
  stStationNm: string;
  firstBusTm: string;
  lastBusTm: string;
  term: string;
  routeType: string;
};

type BusRouteInfoResponse = {
  msgBody?: {
    itemList?: BusRouteInfoRaw | BusRouteInfoRaw[];
  };
  msgHeader?: {
    headerCd: string;
    headerMsg: string;
  };
};

export async function getRouteInfo(busRouteId: string) {
  const url = "http://ws.bus.go.kr/api/rest/busRouteInfo/getRouteInfo";
  const searchParams = new URLSearchParams({
    ServiceKey: env.DATA_GO_KR_API_KEY,
    busRouteId,
    resultType: "json",
  });

  const res = await ky
    .get(`${url}?${searchParams.toString()}`)
    .json<BusRouteInfoResponse>();

  if (res.msgHeader?.headerCd !== "0") {
    console.error("getRouteInfo API Error:", res.msgHeader);
    return null;
  }

  const itemList = res.msgBody?.itemList;
  if (!itemList) return null;

  const items = Array.isArray(itemList) ? itemList : [itemList];
  return items[0] || null;
}
