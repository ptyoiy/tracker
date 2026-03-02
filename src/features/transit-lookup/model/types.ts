// src/features/transit-lookup/model/types.ts

export type TransitMode = "realtime" | "timetable";

export type TransitNearbyRequest = {
  lat: number;
  lng: number;
  referenceTime: string; // ISO 8601
  busRadius?: number;
  subwayRadius?: number;
};

export type TransitNearbyResponse = {
  mode: TransitMode;
  referenceTime: string;
  bus: {
    stations: BusStationResult[];
  };
  subway: {
    stations: SubwayStationResult[];
  };
};

// Bus Types
export type BusStationResult = {
  stationId: string;
  arsId: string;
  stationName: string;
  distance: number;
  lat: number;
  lng: number;
  routes: BusRouteInfo[];
};

export type BusRealtimeInfo = {
  mode: "realtime";
  arrival1: string;
  arrival2?: string;
  congestion?: string;
};

export type BusTimetableInfo = {
  mode: "timetable";
  firstBus: string;
  lastBus: string;
  interval: string;
  operating: boolean;
};

export type BusRouteInfo = {
  routeName: string;
  routeId: string;
  routeType: string;
  destination: string;
} & (BusRealtimeInfo | BusTimetableInfo);

// Subway Types
export type TrainSchedule = {
  trainNo: string;
  departureTime: string; // "14:07"
  isExpress: boolean;
  minutesFromRef: number; // 기준시각 대비 +/-분
};

export type SubwayRealtimeInfo = {
  mode: "realtime";
  arrival: string;
  trainNo?: string;
};

export type SubwayTimetableInfo = {
  mode: "timetable";
  trains: TrainSchedule[];
};

export type SubwayLineInfo = {
  lineName: string;
  stationLineName?: string; // 실제 노선 식별자 (예: "1호선", "2호선") — lineName이 방향명일 때 사용
  direction: string;
  updnLine?: "상행" | "하행" | "내선" | "외선";
} & (SubwayRealtimeInfo | SubwayTimetableInfo);

export type SubwayStationResult = {
  stationName: string;
  stationCode: string;
  distance: number;
  lat: number;
  lng: number;
  lines: SubwayLineInfo[];
};

// ===== 노선 추적 (Route Trace) =====

export type RouteTraceRequest = {
  type: "bus" | "subway";
  routeId: string; // 버스: busRouteId, 지하철: 노선명(예: "2호선")
  boardingStationId: string; // 승차 정류장/역 ID
  referenceTime: string; // ISO 8601
};

export type TraceStop = {
  seq: number;
  stationName: string;
  stationId: string;
  lat: number;
  lng: number;
  cumulativeMinutes: number; // 승차역 기준 누적 소요시간
  isTransfer: boolean; // 환승 가능 여부
};

export type RouteTraceResponse = {
  type: "bus" | "subway";
  routeName: string; // 노선명 (예: "721", "2호선")
  direction: string; // 방면 (예: "건대입구역")
  boardingStation: string;
  stops: TraceStop[];
};
