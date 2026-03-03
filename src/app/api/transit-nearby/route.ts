import type {
  BusStationResult,
  SubwayLineInfo,
  SubwayStationResult,
  TransitNearbyResponse,
} from "@/features/transit-lookup/model/types";
import { getCategorySearch } from "@/shared/api/kakao/category-search";
import { getStationByPos } from "@/shared/api/public-data/bus-station";
import { getSubwayArrival } from "@/shared/api/public-data/subway-arrival";
import {
  getSubwayTimetable,
  type SubwayTimetableRaw,
} from "@/shared/api/public-data/subway-timetable";
import { NextResponse } from "next/server";
import statInfoDataRaw from "../../../../public/data/statInfo.json";

const statInfoData = statInfoDataRaw as Record<
  string,
  { subwayId: string; statnNm: string; lineName: string }
>;

function subwayIdToLineName(subwayId: string): string {
  const map: Record<string, string> = {
    "1001": "1호선",
    "1002": "2호선",
    "1003": "3호선",
    "1004": "4호선",
    "1005": "5호선",
    "1006": "6호선",
    "1007": "7호선",
    "1008": "8호선",
    "1009": "9호선",
    "1063": "경의중앙선",
    "1065": "공항철도",
    "1067": "경춘선",
    "1075": "수인분당선",
    "1077": "신분당선",
    "1092": "우이신설선",
    "1032": "GTX-A",
  };
  return map[subwayId] ?? `${subwayId}호선`;
}
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
  _mode: "realtime" | "timetable",
  _refDate: Date,
): Promise<BusStationResult[]> {
  // 정류장 위치만 조회 (도착 정보는 클라이언트에서 개별 요청)
  const stations = await getStationByPos(lng, lat, radius);
  if (!stations || stations.length === 0) return [];

  return stations.map((st) => ({
    stationId: st.stationId,
    arsId: st.arsId,
    stationName: st.stationNm,
    distance: parseInt(st.dist || "0", 10),
    lat: parseFloat(st.gpsY),
    lng: parseFloat(st.gpsX),
    routes: [], // 도착 정보는 개별 정류장 펼칠 때 lazy-load
  }));
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

  const topStations = uniqueKakaoStations;
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
          const resolvedLineName = subwayIdToLineName(arr.subwayId);
          lines.push({
            lineName: resolvedLineName,
            stationLineName: resolvedLineName,
            direction: arr.trainLineNm,
            updnLine: arr.updnLine as "상행" | "하행" | "내선" | "외선",
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
        const arrivals = await getSubwayArrival(stationName);
        const statnIds = arrivals[0]?.statnList?.split(",") || [];

        for (const statnId of statnIds) {
          if (statnId) {
            const statData = statInfoData[statnId];
            if (!statData) continue;

            const dayOfWeek = refDate.getDay();
            const weekTag = dayOfWeek === 0 ? "3" : dayOfWeek === 6 ? "2" : "1";

            const lineNm = statData.lineName;
            let fetchPromises: Promise<SubwayTimetableRaw[]>[];
            if (lineNm === "2" || lineNm === "2호선") {
              const l2: "2" | "2호선" = lineNm;
              fetchPromises = [
                getSubwayTimetable(l2, stationName, weekTag, "내선"),
                getSubwayTimetable(l2, stationName, weekTag, "외선"),
              ];
            } else {
              fetchPromises = [
                getSubwayTimetable(lineNm, stationName, weekTag, "상행"),
                getSubwayTimetable(lineNm, stationName, weekTag, "하행"),
              ];
            }
            const [up, down] = await Promise.all(fetchPromises);

            const mergeTrains = (items: SubwayTimetableRaw[]) =>
              items
                .map((t) => {
                  const [th, tm, ts] = (t.trainArvlTm || "00:00:00").split(":");
                  const tDate = new Date(refDate);
                  tDate.setHours(
                    Number.parseInt(th, 10),
                    Number.parseInt(tm, 10),
                    Number.parseInt(ts, 10),
                    0,
                  );
                  const diffMins = Math.round(
                    (tDate.getTime() - refDate.getTime()) / 60000,
                  );

                  return {
                    trainNo: t.trainno,
                    departureTime: `${th}:${tm}`,
                    isExpress:
                      t.trainKnd !== null &&
                      t.trainKnd !== "일반" &&
                      t.trainKnd !== "역원", // trainKnd를 기준으로 파악
                    minutesFromRef: diffMins,
                    endStatnNm: t.arvlStnNm,
                  };
                })
                .filter(
                  (t) => t.minutesFromRef >= -15 && t.minutesFromRef <= 45,
                )
                .sort((a, b) => a.minutesFromRef - b.minutesFromRef);

            if (up.length > 0) {
              const isLine2 = lineNm === "2" || lineNm === "2호선";
              const resolvedLineName = statData.lineName || lineNm;
              lines.push({
                lineName: isLine2 ? "내선" : "상행",
                stationLineName: resolvedLineName,
                direction: `${up[0].arvlStnNm} 방면`,
                updnLine: isLine2 ? "내선" : "상행",
                mode: "timetable",
                trains: mergeTrains(up),
              });
            }
            if (down.length > 0) {
              const isLine2 = lineNm === "2" || lineNm === "2호선";
              const resolvedLineName = statData.lineName || lineNm;
              lines.push({
                lineName: isLine2 ? "외선" : "하행",
                stationLineName: resolvedLineName,
                direction: `${down[0].arvlStnNm} 방면`,
                updnLine: isLine2 ? "외선" : "하행",
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
