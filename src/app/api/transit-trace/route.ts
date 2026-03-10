import type {
  RouteTraceRequest,
  RouteTraceResponse,
  TraceStop,
} from "@/features/transit-lookup/model/types";
import { getStationsByRoute } from "@/shared/api/public-data/bus-route-stations";
import { getSubwayTimetable } from "@/shared/api/public-data/subway-timetable";
import { getDrivingRoute } from "@/shared/api/tmap/driving";
import { NextResponse } from "next/server";
import statInfoDataRaw from "../../../../public/data/statInfo.json";

const statInfoData = statInfoDataRaw as Record<
  string,
  { subwayId: string; statnNm: string; lineName: string }
>;

const MAX_POLYLINE_MINUTES = 45;

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

  // 1. 승차역 찾기
  let boardingIdx = allStations.findIndex(
    (s) =>
      s.station === boardingStationId ||
      s.arsId === boardingStationId ||
      s.stationNm === boardingStationId,
  );

  if (boardingIdx === -1) {
    boardingIdx = 0;
  }

  // 2. 방향 분리 (Trip Separation)
  // 서울 버스 API의 'section'은 구간(segment) ID이므로 이를 그룹화로 쓰면 안됨.
  // 대신 'direction'(방면)이 동일하게 유지되는 구간을 하나의 '방향'으로 봅니다.
  const startDirection = allStations[boardingIdx].direction;
  let endIdx = boardingIdx;
  for (let i = boardingIdx + 1; i < allStations.length; i++) {
    // 방면이 바뀌면 다른 방향(회차 등)으로 간주
    if (allStations[i].direction !== startDirection) break;
    endIdx = i;
  }

  // 만약 현재 방면으로 남은 역이 너무 적으면(3개 미만),
  // API가 정보를 잘못 줬을 가능성(회차 직전 등)이 있으므로 최소 15개 혹은 끝까지 가져오도록 폴백
  let stationsAfter = allStations.slice(boardingIdx, endIdx + 1);
  if (stationsAfter.length < 3 && allStations.length > boardingIdx + 1) {
    stationsAfter = allStations.slice(boardingIdx, boardingIdx + 15);
  }

  // 평균 정류장 당 소요시간 (분)
  const AVG_MINUTES_PER_STOP = 1.8;

  const stops: TraceStop[] = stationsAfter
    .map((st, idx) => {
      const lat = parseFloat(st.gpsY);
      const lng = parseFloat(st.gpsX);
      return {
        seq: idx + 1,
        stationName: st.stationNm,
        stationId: st.station,
        lat: Number.isFinite(lat) ? lat : 0,
        lng: Number.isFinite(lng) ? lng : 0,
        cumulativeMinutes: Math.round(idx * AVG_MINUTES_PER_STOP),
        isTransfer: st.transYn === "Y",
      };
    })
    .filter((s) => s.lat !== 0 && s.lng !== 0);

  // 3. 45분 이내 정류장까지만 polyline 생성 (마커는 전체 표시)
  const polylineStops = stops.filter(
    (s) => s.cumulativeMinutes <= MAX_POLYLINE_MINUTES,
  );

  // 4. TMap Driving API 병렬 호출로 곡선 경로 생성
  let polyline: { lat: number; lng: number }[] = [];
  if (polylineStops.length >= 2) {
    polyline = await buildDrivingPolyline(polylineStops);
  }

  const boardingStation =
    allStations[boardingIdx]?.stationNm ||
    (stops[0]?.stationName ?? "알 수 없음");

  const directionLabel =
    stops[stops.length - 1]?.stationName || startDirection || "";

  // Heuristic: seq가 전체의 절반 이후면 '역방향'(1), 아니면 '정방향'(0)
  const boardingSeq = parseInt(allStations[boardingIdx].seq, 10);
  const sectionId = boardingSeq > allStations.length / 2 ? "1" : "0";

  console.log(
    `[DEBUG:traceBusRoute] Result - stops: ${stops.length}, polyline: ${polyline.length}, section: ${sectionId}, dir: ${startDirection}`,
  );

  return {
    type: "bus",
    routeName: allStations[0]?.direction || busRouteId,
    direction: directionLabel,
    boardingStation,
    stops,
    polyline: polyline.length >= 2 ? polyline : undefined,
    section: sectionId,
  };
}

/**
 * 연속 정류장 쌍에 대해 TMap driving 경로를 병렬 호출하고
 * 결과 폴리라인을 이어 붙여 하나의 곡선 경로를 만듭니다.
 * 실패한 구간은 직선(두 좌표)으로 대체합니다.
 */
async function buildDrivingPolyline(
  stops: TraceStop[],
): Promise<{ lat: number; lng: number }[]> {
  const pairs: { from: TraceStop; to: TraceStop }[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    pairs.push({ from: stops[i], to: stops[i + 1] });
  }

  const results = await Promise.allSettled(
    pairs.map(({ from, to }) =>
      getDrivingRoute(
        { lat: from.lat, lng: from.lng },
        { lat: to.lat, lng: to.lng },
      ),
    ),
  );

  const polyline: { lat: number; lng: number }[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled" && result.value?.polyline?.length) {
      const segment = result.value.polyline;
      // 이전 구간의 마지막 점과 현재 구간의 첫 점이 같으면 중복 제거
      if (
        polyline.length > 0 &&
        segment.length > 0 &&
        Math.abs(polyline[polyline.length - 1].lat - segment[0].lat) < 0.0001 &&
        Math.abs(polyline[polyline.length - 1].lng - segment[0].lng) < 0.0001
      ) {
        polyline.push(...segment.slice(1));
      } else {
        polyline.push(...segment);
      }
    } else {
      // 실패 시 직선 폴백
      const from = pairs[i].from;
      const to = pairs[i].to;
      if (
        polyline.length === 0 ||
        polyline[polyline.length - 1].lat !== from.lat
      ) {
        polyline.push({ lat: from.lat, lng: from.lng });
      }
      polyline.push({ lat: to.lat, lng: to.lng });
    }
  }

  return polyline;
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
