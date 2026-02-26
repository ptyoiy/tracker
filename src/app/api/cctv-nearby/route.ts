import { type NextRequest, NextResponse } from "next/server";
import { turso } from "@/shared/lib/turso";
import type { CCTV } from "@/types/cctv";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius")); // meters

  if (!lat || !lng || !radius) {
    return NextResponse.json(
      { error: "lat, lng, and radius are required" },
      { status: 400 },
    );
  }

  try {
    // 1도당 대략적인 거리 (KM)
    const latDegreeKm = 111;
    const lngDegreeKm = 111 * Math.cos(lat * (Math.PI / 180));

    const latDelta = radius / 1000 / latDegreeKm;
    const lngDelta = radius / 1000 / lngDegreeKm;

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

    const sql = `
      SELECT * FROM cctv 
      WHERE lat >= ? AND lat <= ? AND lng >= ? AND lng <= ?
    `;
    const args = [minLat, maxLat, minLng, maxLng];

    const result = await turso.execute({ sql, args });

    const cctvs: CCTV[] = result.rows.map((row) => ({
      id: row.id as string,
      lat: Number(row.lat),
      lng: Number(row.lng),
      direction: (row.shot_angle as string) || "UNKNOWN",
      purpose: (row.purpose as string) || "알 수 없음",
      roadName: (row.road_address as string) || undefined,
      agency: (row.manager_name as string) || undefined,
      source: "SEOUL_OPEN_DATA",
    }));

    return NextResponse.json(cctvs);
  } catch (error) {
    console.error("Failed to fetch nearby CCTV from Turso:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
