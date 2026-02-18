import { NextResponse } from "next/server";
import type {
  IsochroneProfile,
  IsochroneResponse,
} from "@/shared/api/mapbox/isochrone";
import { fetchIsochroneFromMapbox } from "@/shared/api/mapbox/isochrone";
import { buildFallbackIsochrone } from "@/shared/lib/geo/isochrone-fallback";

type IsochroneRequest = {
  lat: number;
  lng: number;
  minutes: number;
  profile: IsochroneProfile;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as IsochroneRequest;

    if (!body || typeof body.lat !== "number" || typeof body.lng !== "number") {
      return NextResponse.json(
        {
          polygons: [],
          fallbackUsed: true,
          errors: "Invalid lat/lng",
        },
        { status: 400 },
      );
    }

    const { lat, lng, minutes, profile } = body;

    const center = { lat, lng };
    const polygons = await fetchIsochroneFromMapbox(profile, center, minutes);

    if (polygons && polygons.length > 0) {
      const res: IsochroneResponse & { errors: null } = {
        polygons,
        fallbackUsed: false,
        errors: null,
      };
      return NextResponse.json(res);
    }

    const fallback = buildFallbackIsochrone(profile, center, minutes);

    const res: IsochroneResponse & { errors: string | null } = {
      polygons: [fallback],
      fallbackUsed: true,
      errors: "Mapbox Isochrone API failed, used circular buffer instead.",
    };

    return NextResponse.json(res);
  } catch (e) {
    const res: IsochroneResponse & { errors: string | null } = {
      polygons: [],
      fallbackUsed: true,
      errors: e instanceof Error ? e.message : "Unknown error",
    };
    return NextResponse.json(res, { status: 500 });
  }
}
