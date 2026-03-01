import ky from "ky";
import { env } from "@/shared/config/env";

export type BusArrivalRaw = {
  arrmsg1: string; // "3분 후"
  arrmsg2: string; // "11분 후"
  busRouteId: string;
  rtNm: string; // 노선명 (예: "402")
  routeType: string; // 노선유형 (간선, 지선 등)
  adirection: string; // 방면
  term: string; // 배차간격 (여기서 제공될 수도 있음)
  firstTm: string; // 첫차
  lastTm: string; // 막차
  isFullFlag1: string; // 혼잡도 정보 (관련 필드 다수 존재, 일단 참고용)
};

type BusArrivalResponse = {
  msgBody?: {
    itemList?: BusArrivalRaw | BusArrivalRaw[];
  };
  msgHeader?: {
    headerCd: string;
    headerMsg: string;
  };
};

export async function getStationByUid(arsId: string) {
  const url = "http://ws.bus.go.kr/api/rest/stationinfo/getStationByUid";
  const searchParams = new URLSearchParams({
    ServiceKey: env.DATA_GO_KR_API_KEY,
    arsId,
    resultType: "json",
  });

  const res = await ky
    .get(`${url}?${searchParams.toString()}`)
    .json<BusArrivalResponse>();

  if (res.msgHeader?.headerCd !== "0") {
    console.error("getStationByUid API Error:", res.msgHeader);
    return [];
  }

  const itemList = res.msgBody?.itemList;
  if (!itemList) return [];

  return Array.isArray(itemList) ? itemList : [itemList];
}
