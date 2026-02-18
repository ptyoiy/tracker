import { NextResponse } from "next/server";
import {
  buildDrivingRouteInfo,
  buildPedestrianRouteInfo,
  buildTransitRouteInfo,
} from "@/features/route-analysis/lib/route-builder";
import { filterByDurationTolerance } from "@/features/route-analysis/lib/route-filter";
import { buildSegmentAnalyses } from "@/features/route-analysis/lib/segment-analyzer";
import { getDrivingRoute } from "@/shared/api/tmap/driving";
import { getPedestrianRoute } from "@/shared/api/tmap/pedestrian";
import { getTransitRoute } from "@/shared/api/tmap/transit";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  RouteInfo,
} from "@/types/analyze";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AnalyzeRequest;

    if (!body.observations || body.observations.length < 2) {
      const res: AnalyzeResponse = {
        segments: [],
        fallbackUsed: true,
        errors: "At least 2 observations required",
      };
      return NextResponse.json(res, { status: 400 });
    }

    const baseSegments = buildSegmentAnalyses(body.observations);

    const enhancedSegments = await Promise.all(
      baseSegments.map(async (segment, index) => {
        const from = { lat: segment.from.lat, lng: segment.from.lng };
        const to = { lat: segment.to.lat, lng: segment.to.lng };

        const [pedRes, drvRes, trnRes] = await Promise.allSettled([
          getPedestrianRoute(from, to),
          getDrivingRoute(from, to),
          getTransitRoute(from, to),
        ]);

        const routeInfos: RouteInfoWithType[] = [];

        if (pedRes.status === "fulfilled" && pedRes.value) {
          routeInfos.push({
            type: "pedestrian",
            info: buildPedestrianRouteInfo(`seg${index}-ped`, pedRes.value),
          });
        }
        if (drvRes.status === "fulfilled" && drvRes.value) {
          routeInfos.push({
            type: "driving",
            info: buildDrivingRouteInfo(`seg${index}-drv`, drvRes.value),
          });
        }
        if (trnRes.status === "fulfilled" && trnRes.value) {
          routeInfos.push({
            type: "transit",
            info: buildTransitRouteInfo(`seg${index}-trn`, trnRes.value),
          });
        }

        const filtered = filterByDurationTolerance(
          routeInfos.map((r) => r.info),
          segment.durationSeconds,
        );

        return {
          ...segment,
          candidateRoutes: filtered,
        };
      }),
    );

    const anyRouteUsed = enhancedSegments.some(
      (s) => s.candidateRoutes.length > 0,
    );

    const res: AnalyzeResponse = {
      segments: enhancedSegments,
      fallbackUsed: !anyRouteUsed,
      errors: null,
    };

    return NextResponse.json(res);
  } catch (e) {
    const res: AnalyzeResponse = {
      segments: [],
      fallbackUsed: true,
      errors: e instanceof Error ? e.message : "Unknown error",
    };
    return NextResponse.json(res, { status: 500 });
  }
}

type RouteInfoWithType = {
  type: "pedestrian" | "driving" | "transit";
  info: RouteInfo;
};
