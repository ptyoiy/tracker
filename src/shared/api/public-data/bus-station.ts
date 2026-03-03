import { env } from "@/shared/config/env";
import ky from "ky";

export type BusStationRaw = {
  stationId: string;
  arsId: string;
  stationNm: string;
  gpsX: string; // 경도 (WGS84)
  gpsY: string; // 위도 (WGS84)
  posX: string; // 경도 (TM 좌표)
  posY: string; // 위도 (TM 좌표)
  stationTp: string; // 정류장 타입
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

/** 정류소정보조회 서비스 */
export async function getStationByPos(
  tmX: number,
  tmY: number,
  radius = 500,
): Promise<BusStationRaw[]> {
  const url = "http://ws.bus.go.kr/api/rest/stationinfo/getStationByPos";
  const searchParams = new URLSearchParams({
    serviceKey: env.DATA_GO_KR_API_SUBWAY_TIMETABLE_KEY,
    tmX: String(tmX),
    tmY: String(tmY),
    radius: String(radius),
    resultType: "json",
  });

  console.log("[DEBUG:getStationByPos] 요청 파라미터:", { tmX, tmY, radius });
  console.log(
    "[DEBUG:getStationByPos] URL:",
    `${url}?${searchParams.toString().replace(env.DATA_GO_KR_API_SUBWAY_TIMETABLE_KEY, "KEY_HIDDEN")}`,
  );

  const res = await ky
    .get(`${url}?${searchParams.toString()}`)
    .json<BusStationResponse>();

  console.log(
    "[DEBUG:getStationByPos] 응답 전체:",
    JSON.stringify(res).slice(0, 500),
  );

  if (res.msgHeader?.headerCd !== "0") {
    console.error(
      "[DEBUG:getStationByPos] API Error - headerCd:",
      res.msgHeader?.headerCd,
      "headerMsg:",
      res.msgHeader?.headerMsg,
    );
    return [];
  }

  const itemList = res.msgBody?.itemList;
  if (!itemList) {
    console.log(
      "[DEBUG:getStationByPos] itemList가 없습니다. msgBody:",
      JSON.stringify(res.msgBody),
    );
    return [];
  }

  // 서울시 OpenAPI는 항목이 1개일 때 배열이 아닌 객체로 반환할 수 있음
  const items = Array.isArray(itemList) ? itemList : [itemList];
  console.log(
    "[DEBUG:getStationByPos] 결과 정류장 수:",
    items.length,
    "첫 번째:",
    items[0],
  );

  return items;
}
