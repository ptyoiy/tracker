import { getStationByUid } from "@/shared/api/public-data/bus-arrival";
import { getRouteInfo } from "@/shared/api/public-data/bus-route-info";
import { NextResponse } from "next/server";

type RouteResult = {
  routeName: string;
  routeId: string;
  routeType: string;
  destination: string;
  mode: "realtime" | "timetable";
  arrival1?: string;
  arrival2?: string;
  congestion?: string;
  firstBus?: string;
  lastBus?: string;
  interval?: string;
  operating?: boolean;
};

export async function POST(req: Request) {
  try {
    const { arsId, mode, referenceTime } = await req.json();

    if (!arsId) {
      return NextResponse.json({ error: "arsId required" }, { status: 400 });
    }

    const effectiveMode = mode || "realtime";
    const refDate = referenceTime ? new Date(referenceTime) : new Date();
    const arrivals = await getStationByUid(arsId);

    if (!arrivals || arrivals.length === 0) {
      return NextResponse.json({ routes: [] });
    }

    const routes: RouteResult[] = [];

    if (effectiveMode === "realtime") {
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
          console.error("Bus Route Info fetch fail:", e);
        }
      }
    }

    return NextResponse.json({ routes });
  } catch (error: unknown) {
    console.error("bus-station-arrivals API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
