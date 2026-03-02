import { MOCK_STATIONS_BY_ROUTE } from "./mocks";

// import { env } from "@/shared/config/env";
// import ky from "ky";

export type BusRouteStationRaw = {
  stationNo: string; // 정류장 번호
  stationNm: string; // 정류장 이름
  arsId: string; // 정류장 고유번호
  stationId: string;
  seq: string; // 순번
  section: string; // 구간
  gpsX: string; // 경도
  gpsY: string; // 위도
  direction: string; // 방면 정보
  fullSectDist: string; // 구간거리
  beginTm: string; // 첫차시간
  lastTm: string; // 막차시간
  transYn: string; // 환승정류장 여부
};

// type BusRouteStationResponse = {
//   msgBody?: {
//     itemList?: BusRouteStationRaw | BusRouteStationRaw[];
//   };
//   msgHeader?: {
//     headerCd: string;
//     headerMsg: string;
//   };
// };

/** 노선별 경유 정류장 목록 조회 */
export async function getStationsByRoute(
  busRouteId: string,
): Promise<BusRouteStationRaw[]> {
  // TODO: 실제 API 승인 전까지 임시 데이터 사용
  console.log("getStationsByRoute called with:", busRouteId);
  return MOCK_STATIONS_BY_ROUTE;

  // const url = "http://ws.bus.go.kr/api/rest/busRouteInfo/getStaionByRoute";
  // const searchParams = new URLSearchParams({
  //   serviceKey: env.DATA_GO_KR_API_SUBWAY_TIMETABLE_KEY,
  //   busRouteId,
  //   resultType: "json",
  // });

  // const res = await ky
  //   .get(`${url}?${searchParams.toString()}`)
  //   .json<BusRouteStationResponse>();

  // if (res.msgHeader?.headerCd !== "0") {
  //   console.error("getStationsByRoute API Error:", res.msgHeader);
  //   return [];
  // }

  // const itemList = res.msgBody?.itemList;
  // if (!itemList) return [];
  // return Array.isArray(itemList) ? itemList : [itemList];
}
