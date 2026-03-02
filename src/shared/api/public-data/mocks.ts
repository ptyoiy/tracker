// src/shared/api/public-data/mocks.ts
import type { BusArrivalRaw } from "./bus-arrival";
import type { BusRouteInfoRaw } from "./bus-route-info";
import type { BusStationRaw } from "./bus-station";

export const MOCK_ROUTE_INFO: BusRouteInfoRaw = {
  busRouteId: "100100112",
  busRouteNm: "721",
  edStationNm: "건대입구역",
  stStationNm: "서부운수기점",
  firstBusTm: "0420",
  lastBusTm: "2240",
  term: "12",
  routeType: "3", // 간선
};

export const MOCK_STATIONS_BY_POS: BusStationRaw[] = [
  {
    stationId: "112000202",
    arsId: "13285",
    stationNm: "서부운수기점",
    tmX: "126.910757",
    tmY: "37.581336",
    dist: "120",
  },
  {
    stationId: "112000092",
    arsId: "13175",
    stationNm: "북가좌2동주민센터",
    tmX: "126.911478",
    tmY: "37.580290",
    dist: "249",
  },
  {
    stationId: "112000093",
    arsId: "13176",
    stationNm: "증산교앞",
    tmX: "126.912478",
    tmY: "37.581290",
    dist: "400",
  },
];

export const MOCK_ARRIVALS_BY_UID: BusArrivalRaw[] = [
  {
    arrmsg1: "3분 후 (1정류장)",
    arrmsg2: "11분 후 (5정류장)",
    busRouteId: "100100112",
    rtNm: "721",
    routeType: "3",
    adirection: "건대입구역",
    term: "12",
    firstTm: "04:20",
    lastTm: "22:40",
    isFullFlag1: "0",
  },
  {
    arrmsg1: "곧 도착",
    arrmsg2: "운행종료",
    busRouteId: "104000010",
    rtNm: "402",
    routeType: "3",
    adirection: "광화문",
    term: "8",
    firstTm: "04:00",
    lastTm: "23:00",
    isFullFlag1: "1", // 혼잡
  },
  {
    arrmsg1: "15분 후 (8정류장)",
    arrmsg2: "25분 후 (13정류장)",
    busRouteId: "104000011",
    rtNm: "141",
    routeType: "3",
    adirection: "도봉산",
    term: "10",
    firstTm: "04:10",
    lastTm: "22:30",
    isFullFlag1: "0",
  },
];
