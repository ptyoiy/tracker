// src/shared/api/tmap/transit.ts
import ky from "ky";
import { env } from "@/shared/config/env";
import type { TmapLatLng } from "./types";

export type TmapTransitLegMode = "WALK" | "BUS" | "SUBWAY";

export type TmapTransitLeg = {
  mode: TmapTransitLegMode;
  distanceMeters: number;
  durationSeconds: number;
  polyline: TmapLatLng[];
};

export type TmapTransitRoute = {
  distanceMeters: number;
  durationSeconds: number;
  legs: TmapTransitLeg[];
};

type RawTransitLeg = {
  mode: string; // "WALK" | "BUS" | "SUBWAY" | ...
  distance?: number;
  sectionTime?: number;
  // 도보 구간의 좌표
  steps?: {
    linestring?: string; // "lon,lat lon,lat ..."
  }[];
  // 버스/지하철 구간의 좌표
  passShape?: {
    linestring?: string; // "lon,lat lon,lat ..."
  };
};

type RawTransitItinerary = {
  totalTime?: number;
  totalDistance?: number;
  legs?: RawTransitLeg[];
};

type RawTransitResponse = {
  metaData?: {
    plan?: {
      itineraries?: RawTransitItinerary[];
    };
  };
};

const TMAP_TRANSIT_URL = "https://apis.openapi.sk.com/transit/routes";

function toLegMode(mode: string | undefined): TmapTransitLegMode {
  if (mode === "BUS") return "BUS";
  if (mode === "SUBWAY" || mode === "TRAIN") return "SUBWAY";
  return "WALK";
}

function parseLinestring(linestring?: string): TmapLatLng[] {
  if (!linestring) return [];
  const points: TmapLatLng[] = [];

  // "lon,lat lon,lat ..." 형식을 파싱
  linestring.split(" ").forEach((pair) => {
    const [lngStr, latStr] = pair.split(",");
    if (!lngStr || !latStr) return;
    const lng = Number(lngStr);
    const lat = Number(latStr);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      points.push({ lat, lng });
    }
  });

  return points;
}

export async function getTransitRoute(
  from: TmapLatLng,
  to: TmapLatLng,
  searchDttm?: string, // YYYYMMDDHHMM
): Promise<TmapTransitRoute | null> {
  const body = {
    startX: from.lng,
    startY: from.lat,
    endX: to.lng,
    endY: to.lat,
    lang: 0,
    format: "json",
    reqCoordType: "WGS84GEO",
    resCoordType: "WGS84GEO",
    searchDttm,
  };

  try {
    const res = await ky
      .post(TMAP_TRANSIT_URL, {
        headers: {
          "Content-Type": "application/json",
          appKey: env.TMAP_APP_KEY,
        },
        json: body,
        timeout: 10000,
      })
      .json<RawTransitResponse>();

    const itineraries = res.metaData?.plan?.itineraries;
    console.dir(itineraries, { depth: 3 });
    if (!itineraries || itineraries.length === 0) return null;
    // 일단 첫 번째(추천) 경로만 사용
    const first = itineraries[0];
    const rawLegs = first.legs ?? [];
    if (rawLegs.length === 0) return null;

    const legs: TmapTransitLeg[] = [];

    // 총 거리/시간은 응답에 있으면 그대로 쓰고, 없으면 legs 합산
    let totalDistance = first.totalDistance ?? 0;
    let totalTime = first.totalTime ?? 0;

    if (!totalDistance || !totalTime) {
      totalDistance = 0;
      totalTime = 0;
      rawLegs.forEach((leg) => {
        totalDistance += leg.distance ?? 0;
        totalTime += leg.sectionTime ?? 0;
      });
    }

    for (const leg of rawLegs) {
      const mode = toLegMode(leg.mode);
      const distanceMeters = leg.distance ?? 0;
      const durationSeconds = leg.sectionTime ?? 0;

      let polyline: TmapLatLng[] = [];

      if (mode === "WALK" && leg.steps && leg.steps.length > 0) {
        // 도보는 steps[].linestring을 이어붙인다.
        polyline = leg.steps.flatMap((s) => parseLinestring(s.linestring));
      } else {
        // 버스/지하철 등은 passShape.linestring 사용
        polyline = parseLinestring(leg.passShape?.linestring);
      }

      legs.push({
        mode,
        distanceMeters,
        durationSeconds,
        polyline,
      });
    }

    return {
      distanceMeters: totalDistance,
      durationSeconds: totalTime,
      legs,
    };
  } catch (err) {
    console.error("[TMAP transit] getTransitRoute error", err);
    return null;
  }
}
