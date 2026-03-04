import type {
  RouteTraceRequest,
  RouteTraceResponse,
  TraceStop,
} from "@/features/transit-lookup/model/types";
import { getStationsByRoute } from "@/shared/api/public-data/bus-route-stations";
import { getSubwayTimetable } from "@/shared/api/public-data/subway-timetable";
import { NextResponse } from "next/server";
import statInfoDataRaw from "../../../../public/data/statInfo.json";

const statInfoData = statInfoDataRaw as Record<
  string,
  { subwayId: string; statnNm: string; lineName: string }
>;

export async function POST(req: Request) {
  try {
    const body: RouteTraceRequest = await req.json();
    const { type, routeId, boardingStationId, referenceTime } = body;

    if (!type || !routeId || !boardingStationId || !referenceTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const refDate = new Date(referenceTime);

    if (type === "bus") {
      const result = await traceBusRoute(routeId, boardingStationId, refDate);
      return NextResponse.json(result);
    }

    if (type === "subway") {
      const result = await traceSubwayRoute(
        routeId,
        boardingStationId,
        refDate,
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: unknown) {
    console.error("transit-trace API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

// =========== 버스 노선 추적 ===========
async function traceBusRoute(
  busRouteId: string,
  boardingStationId: string,
  _refDate: Date,
): Promise<RouteTraceResponse> {
  const allStations = await getStationsByRoute(busRouteId);

  // 승차 정류장의 seq 찾기 (stationId → arsId → stationNm 순서로 fallback)
  let boardingIdx = allStations.findIndex(
    (s) => s.stationId === boardingStationId || s.arsId === boardingStationId,
  );

  // stationId/arsId 매칭 실패 시 stationNm으로 재시도
  if (boardingIdx === -1) {
    boardingIdx = allStations.findIndex(
      (s) => s.stationNm === boardingStationId,
    );
  }

  // 승차역 이후 정류장만 추출
  const stationsAfter =
    boardingIdx >= 0 ? allStations.slice(boardingIdx) : allStations;

  // 평균 정류장 당 소요시간 (분) - 서울 시내버스 기준 약 1.5~2분
  const AVG_MINUTES_PER_STOP = 1.8;

  const stops: TraceStop[] = stationsAfter.map((st, idx) => ({
    seq: idx + 1,
    stationName: st.stationNm,
    stationId: st.stationId,
    lat: parseFloat(st.gpsY),
    lng: parseFloat(st.gpsX),
    cumulativeMinutes: Math.round(idx * AVG_MINUTES_PER_STOP),
    isTransfer: st.transYn === "Y",
  }));

  const boardingStation =
    boardingIdx >= 0
      ? allStations[boardingIdx].stationNm
      : (allStations[0]?.stationNm ?? "알 수 없음");

  return {
    type: "bus",
    routeName: allStations[0]?.direction || busRouteId,
    direction: stationsAfter[stationsAfter.length - 1]?.direction || "",
    boardingStation,
    stops,
  };
}

// =========== 지하철 노선 추적 ===========
async function traceSubwayRoute(
  lineName: string,
  boardingStationName: string,
  refDate: Date,
): Promise<RouteTraceResponse> {
  // statInfo에서 해당 노선의 역 목록을 추출
  const lineStations = Object.entries(statInfoData)
    .filter(([, v]) => v.lineName === lineName)
    .map(([statnId, v]) => ({
      statnId,
      stationName: v.statnNm,
      lineName: v.lineName,
    }));

  if (lineStations.length === 0) {
    return {
      type: "subway",
      routeName: lineName,
      direction: "해당 노선 정보를 찾을 수 없습니다",
      boardingStation: boardingStationName,
      stops: [],
    };
  }

  // 승차역 인덱스 찾기
  const boardingIdx = lineStations.findIndex(
    (s) => s.stationName === boardingStationName,
  );

  // 시간표를 활용하여 방향 정보 획득 시도
  const dayOfWeek = refDate.getDay();
  const weekTag: "1" | "2" | "3" =
    dayOfWeek === 0 ? "3" : dayOfWeek === 6 ? "2" : "1";
  const isLine2 = lineName === "2호선" || lineName === "2";

  let directionLabel = "";
  try {
    // 시간표 API용 lineNm 파라미터 결정 (API는 "1호선" 형식을 그대로 사용)
    if (isLine2) {
      const l2: "2" | "2호선" = lineName as "2" | "2호선";
      const trains = await getSubwayTimetable(
        l2,
        boardingStationName,
        weekTag,
        "내선",
      );
      if (trains.length > 0) {
        directionLabel = `${trains[0].arvlStnNm} 방면`;
      }
    } else {
      const trains = await getSubwayTimetable(
        lineName,
        boardingStationName,
        weekTag,
        "상행",
      );
      if (trains.length > 0) {
        directionLabel = `${trains[0].arvlStnNm} 방면`;
      }
    }
  } catch (e) {
    console.error("Subway timetable fetch fail for trace:", e);
  }

  // 승차역 이후 정류장 추출
  const stationsAfter =
    boardingIdx >= 0 ? lineStations.slice(boardingIdx) : lineStations;

  // 지하철 역간 평균 소요시간: 약 2분
  const AVG_MINUTES_PER_STATION = 2;

  const stops: TraceStop[] = stationsAfter.map((st, idx) => ({
    seq: idx + 1,
    stationName: `${st.stationName}역`,
    stationId: st.statnId,
    lat: 0,
    lng: 0,
    cumulativeMinutes: Math.round(idx * AVG_MINUTES_PER_STATION),
    isTransfer: false,
  }));

  return {
    type: "subway",
    routeName: lineName,
    direction: directionLabel || `${lineName} 전체 역`,
    boardingStation: boardingStationName,
    stops,
  };
}
