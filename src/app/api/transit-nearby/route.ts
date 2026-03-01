import type {
  BusRouteInfo,
  BusStationResult,
  SubwayLineInfo,
  SubwayStationResult,
  TransitNearbyResponse,
} from "@/features/transit-lookup/model/types";
import { getCategorySearch } from "@/shared/api/kakao/category-search";
import { getStationByUid } from "@/shared/api/public-data/bus-arrival";
import { getRouteInfo } from "@/shared/api/public-data/bus-route-info";
import { getStationByPos } from "@/shared/api/public-data/bus-station";
import { getSubwayArrival } from "@/shared/api/public-data/subway-arrival";
import { getSubwayTimetable } from "@/shared/api/public-data/subway-timetable";
import subwayStations from "@/shared/config/subway-stations.json";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      lat,
      lng,
      referenceTime,
      forceMode,
      busRadius = 500,
      subwayRadius = 1000,
    } = body;

    if (!lat || !lng || !referenceTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 모드 판별
    let mode: "realtime" | "timetable" = "realtime";
    const refDate = new Date(referenceTime);
    const now = new Date();
    const diffMs = Math.abs(refDate.getTime() - now.getTime());
    const diffMins = diffMs / (1000 * 60);

    if (forceMode && forceMode !== "auto") {
      mode = forceMode as "realtime" | "timetable";
    } else {
      mode = diffMins <= 15 ? "realtime" : "timetable";
    }

    // 병렬 처리: 버스와 지하철 정보 동시 획득
    const [busResult, subwayResult] = await Promise.all([
      fetchBusData(lat, lng, busRadius, mode, refDate),
      fetchSubwayData(lat, lng, subwayRadius, mode, refDate),
    ]);

    const response: TransitNearbyResponse = {
      mode,
      referenceTime,
      bus: { stations: busResult },
      subway: { stations: subwayResult },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("transit-nearby API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

// ---------------- 버스 ----------------
async function fetchBusData(
  lat: number,
  lng: number,
  radius: number,
  mode: "realtime" | "timetable",
  refDate: Date,
): Promise<BusStationResult[]> {
  const stations = await getStationByPos(lng, lat, radius);
  if (!stations || stations.length === 0) return [];

  // 부하 방지용 상위 5개
  const topStations = stations.slice(0, 5);
  const results: BusStationResult[] = [];

  for (const st of topStations) {
    try {
      const distance = parseInt(st.dist || "0", 10);
      const arrivals = await getStationByUid(st.arsId);

      const routes: BusRouteInfo[] = [];

      if (mode === "realtime") {
        for (const arr of arrivals) {
          routes.push({
            routeName: arr.rtNm,
            routeId: arr.busRouteId,
            routeType: arr.routeType || "이용",
            destination: arr.adirection,
            mode: "realtime",
            arrival1: arr.arrmsg1,
            arrival2: arr.arrmsg2 !== "운행종료" ? arr.arrmsg2 : undefined,
            congestion: arr.isFullFlag1 === "1" ? "혼잡" : undefined,
          });
        }
      } else {
        // 시간표 모드
        for (const arr of arrivals) {
          try {
            const info = await getRouteInfo(arr.busRouteId);
            if (info) {
              const refH = refDate.getHours().toString().padStart(2, "0");
              const refM = refDate.getMinutes().toString().padStart(2, "0");
              const refTimeStr = `${refH}${refM}`;

              const firstTm = info.firstBusTm || "0400";
              const lastTm = info.lastBusTm || "2300";

              let operating = false;
              if (firstTm <= lastTm) {
                operating = refTimeStr >= firstTm && refTimeStr <= lastTm;
              } else {
                operating = refTimeStr >= firstTm || refTimeStr <= lastTm;
              }

              routes.push({
                routeName: arr.rtNm,
                routeId: arr.busRouteId,
                routeType: info.routeType || "이용",
                destination: info.edStationNm || arr.adirection,
                mode: "timetable",
                firstBus: `${firstTm.slice(0, 2)}:${firstTm.slice(2, 4)}`,
                lastBus: `${lastTm.slice(0, 2)}:${lastTm.slice(2, 4)}`,
                interval: info.term ? `${info.term}분` : "정보없음",
                operating,
              });
            }
          } catch (e) {
            console.error("Bus Route Info fetch fail", e);
          }
        }
      }

      results.push({
        stationId: st.stationId,
        arsId: st.arsId,
        stationName: st.stationNm,
        distance,
        lat: parseFloat(st.tmY),
        lng: parseFloat(st.tmX),
        routes,
      });
    } catch (e) {
      console.error("Bus station processing error", e);
    }
  }

  return results;
}

// ---------------- 지하철 ----------------
async function fetchSubwayData(
  lat: number,
  lng: number,
  radius: number,
  mode: "realtime" | "timetable",
  refDate: Date,
): Promise<SubwayStationResult[]> {
  const kakaoStations = await getCategorySearch("SW8", lng, lat, radius);
  if (!kakaoStations || kakaoStations.length === 0) return [];

  // 카카오 검색 결과에서 역 이름(역명) 중복 제거
  const uniqueKakaoStations = [];
  const seenNames = new Set<string>();

  for (const st of kakaoStations) {
    const rawName = st.place_name.split(" ")[0].replace(/역$/, "");
    if (!seenNames.has(rawName)) {
      seenNames.add(rawName);
      uniqueKakaoStations.push({ ...st, stationName: rawName });
    }
  }

  const topStations = uniqueKakaoStations.slice(0, 3);
  const results: SubwayStationResult[] = [];

  for (const st of topStations) {
    const stationName = st.stationName;
    const distance = parseInt(st.distance || "0", 10);
    const latNum = parseFloat(st.y);
    const lngNum = parseFloat(st.x);

    const lines: SubwayLineInfo[] = [];

    if (mode === "realtime") {
      try {
        const arrivals = await getSubwayArrival(stationName);
        for (const arr of arrivals) {
          lines.push({
            lineName:
              arr.subwayId === "1002"
                ? "2호선"
                : arr.subwayId === "1001"
                  ? "1호선"
                  : "지하철",
            direction: arr.trainLineNm,
            mode: "realtime",
            arrival: arr.arvlMsg2,
            trainNo: arr.btrainNo,
          });
        }
      } catch (e) {
        console.error("Subway realtime fetch fail", e);
      }
    } else {
      try {
        const mapping = subwayStations as Record<string, string>;
        const stationCode = mapping[stationName];

        if (stationCode) {
          const dayOfWeek = refDate.getDay();
          const weekTag = dayOfWeek === 0 ? "3" : dayOfWeek === 6 ? "2" : "1";

          const [up, down] = await Promise.all([
            getSubwayTimetable(stationCode, weekTag, "1"),
            getSubwayTimetable(stationCode, weekTag, "2"),
          ]);

          const mergeTrains = (
            items: {
              arrTime?: string;
              trainNo: string;
              expressYn: string;
              endStatnNm: string;
            }[],
          ) =>
            items
              .map((t) => {
                const [th, tm, ts] = (t.arrTime || "00:00:00").split(":");
                const tDate = new Date(refDate);
                tDate.setHours(parseInt(th), parseInt(tm), parseInt(ts), 0);
                const diffMins = Math.round(
                  (tDate.getTime() - refDate.getTime()) / 60000,
                );

                return {
                  trainNo: t.trainNo,
                  departureTime: `${th}:${tm}`,
                  isExpress: t.expressYn === "D",
                  minutesFromRef: diffMins,
                  endStatnNm: t.endStatnNm,
                };
              })
              .filter((t) => t.minutesFromRef >= -15 && t.minutesFromRef <= 45)
              .sort((a, b) => a.minutesFromRef - b.minutesFromRef);

          if (up.length > 0) {
            lines.push({
              lineName: "상행/내선",
              direction: up[0].endStatnNm + " 방면",
              mode: "timetable",
              trains: mergeTrains(up),
            });
          }
          if (down.length > 0) {
            lines.push({
              lineName: "하행/외선",
              direction: down[0].endStatnNm + " 방면",
              mode: "timetable",
              trains: mergeTrains(down),
            });
          }
        } else {
          // 역 코드가 없는 경우 의미 없는 열차 데이터를 넣지 않고 안내 메시지만 추가
          lines.push({
            lineName: "안내",
            direction: "시간표 미지원 (역코드 매핑 필요)",
            mode: "timetable",
            trains: [],
          });
        }
      } catch (e) {
        console.error("Subway timetable fetch fail", e);
      }
    }

    results.push({
      stationName,
      stationCode: stationName,
      distance,
      lat: latNum,
      lng: lngNum,
      lines,
    });
  }

  return results;
}
