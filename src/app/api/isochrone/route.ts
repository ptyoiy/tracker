import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchIsochroneFromMapbox } from "@/shared/api/mapbox/isochrone";

const isochroneRequestSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  minutes: z.number().min(1).max(60),
  profile: z.enum(["walking", "driving", "cycling"]).default("walking"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = isochroneRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          polygons: [],
          fallbackUsed: true,
          errors: "Invalid request parameters",
        },
        { status: 400 },
      );
    }

    const { lat, lng, minutes, profile } = parsed.data;

    const polygons = await fetchIsochroneFromMapbox(
      profile,
      { lat, lng },
      minutes,
    );

    if (!polygons) {
      return NextResponse.json({
        polygons: [],
        fallbackUsed: true,
        errors: "Failed to fetch isochrone from Mapbox",
      });
    }

    return NextResponse.json({
      polygons,
      fallbackUsed: false,
      errors: null,
    });
  } catch (error) {
    console.error("Isochrone API error:", error);
    return NextResponse.json(
      { polygons: [], fallbackUsed: true, errors: "Internal server error" },
      { status: 500 },
    );
  }
}
