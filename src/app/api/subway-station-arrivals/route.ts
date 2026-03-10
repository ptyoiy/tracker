import type { SubwayLineInfo } from "@/features/transit-lookup/model/types";
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
    const { stationName, mode = "realtime", referenceTime } = await req.json();

    if (!stationName) {
      return NextResponse.json(
        { error: "stationName required" },
        { status: 400 },
      );
    }

    const refDate = referenceTime ? new Date(referenceTime) : new Date();
    // KST
    const kstDate = new Date(
      refDate.getTime() +
        9 * 60 * 60 * 1000 +
        refDate.getTimezoneOffset() * 60 * 1000,
    );

    const now = new Date();
    const diffMins = Math.abs(refDate.getTime() - now.getTime()) / (1000 * 60);
    const effectiveMode =
      mode === "auto" ? (diffMins <= 15 ? "realtime" : "timetable") : mode;

    const lines: SubwayLineInfo[] = [];

    if (effectiveMode === "realtime") {
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

            const dayOfWeek = kstDate.getDay();
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
                  const diffM = Math.round(
                    (tDate.getTime() - refDate.getTime()) / 60000,
                  );

                  return {
                    trainNo: t.trainno,
                    departureTime: `${th}:${tm}`,
                    isExpress:
                      t.trainKnd !== null &&
                      t.trainKnd !== "일반" &&
                      t.trainKnd !== "역원",
                    minutesFromRef: diffM,
                    endStatnNm: t.arvlStnNm,
                  };
                })
                .filter(
                  (t) => t.minutesFromRef >= -15 && t.minutesFromRef <= 45,
                )
                .sort((a, b) => a.minutesFromRef - b.minutesFromRef);

            if (up.length > 0) {
              const isLine2 = lineNm === "2" || lineNm === "2호선";
              lines.push({
                lineName: isLine2 ? "내선" : "상행",
                stationLineName: statData.lineName || lineNm,
                direction: `${up[0].arvlStnNm} 방면`,
                updnLine: isLine2 ? "내선" : "상행",
                mode: "timetable",
                trains: mergeTrains(up),
              });
            }
            if (down.length > 0) {
              const isLine2 = lineNm === "2" || lineNm === "2호선";
              lines.push({
                lineName: isLine2 ? "외선" : "하행",
                stationLineName: statData.lineName || lineNm,
                direction: `${down[0].arvlStnNm} 방면`,
                updnLine: isLine2 ? "외선" : "하행",
                mode: "timetable",
                trains: mergeTrains(down),
              });
            }
          }
        }
      } catch (e) {
        console.error("Subway timetable fetch fail", e);
      }
    }

    return NextResponse.json({ lines });
  } catch (error: unknown) {
    console.error("subway-station-arrivals API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Error" },
      { status: 500 },
    );
  }
}
