import { env } from "@/shared/config/env";
import ky from "ky";

export type BusStationRaw = {
  stationId: string;
  arsId: string;
  stationNm: string;
  tmX: string;
  tmY: string;
  dist: string;
};

type BusStationResponse = {
  msgBody?: {
    itemList?: BusStationRaw | BusStationRaw[];
  };
  msgHeader?: {
    headerCd: string;
    headerMsg: string;
  };
};

export async function getStationByPos(tmX: number, tmY: number, radius = 500) {
  const url = "http://ws.bus.go.kr/api/rest/stationinfo/getStationByPos";
  const searchParams = new URLSearchParams({
    serviceKey: env.DATA_GO_KR_API_KEY,
    tmX: String(tmX),
    tmY: String(tmY),
    radius: String(radius),
    resultType: "json",
  });

  const res = await ky
    .get(`${url}?${searchParams.toString()}`)
    .json<BusStationResponse>();

  if (res.msgHeader?.headerCd !== "0") {
    console.error("getStationByPos API Error:", res.msgHeader);
    return [];
  }

  const itemList = res.msgBody?.itemList;
  if (!itemList) return [];

  // 서울시 OpenAPI는 항목이 1개일 때 배열이 아닌 객체로 반환할 수 있음
  const items = Array.isArray(itemList) ? itemList : [itemList];

  return items;
}
