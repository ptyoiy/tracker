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
  direction: string;
} & (SubwayRealtimeInfo | SubwayTimetableInfo);

export type SubwayStationResult = {
  stationName: string;
  stationCode: string;
  distance: number;
  lat: number;
  lng: number;
  lines: SubwayLineInfo[];
};
