// app/api/cctv/route.ts (Next.js 15 App Router 기준)

import { type NextRequest, NextResponse } from "next/server";
import { turso } from "@/shared/lib/turso";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const orgCode = searchParams.get("opnCode");
  const minLat = searchParams.get("minLat");
  const maxLat = searchParams.get("maxLat");
  const minLng = searchParams.get("minLng");
  const maxLng = searchParams.get("maxLng");

  try {
    let sql = "SELECT * FROM cctv WHERE 1=1";
    const args = [];

    if (orgCode) {
      sql += " AND org_code = ?";
      args.push(orgCode);
    }

    if (minLat && maxLat && minLng && maxLng) {
      sql += " AND lat >= ? AND lat <= ? AND lng >= ? AND lng <= ?";
      args.push(Number(minLat), Number(maxLat), Number(minLng), Number(maxLng));
    }

    const result = await turso.execute({ sql, args });

    // Format to match the structure expected by the frontend if needed,
    // or just return the rows. The user mentioned they want to use the items array.
    // For compatibility with the previous public API response structure:
    return NextResponse.json({
      response: {
        header: { resultCode: "0", resultMsg: "NORMAL SERVICE." },
        body: {
          items: {
            item: result.rows.map((row) => ({
              MNG_NO: row.id,
              INSTL_PRPS_SE_NM: row.purpose,
              LCTN_LOTNO_ADDR: row.lot_address,
              LCTN_ROAD_NM_ADDR: row.road_address,
              MNG_INST_NM: row.manager_name,
              OPN_ATMY_GRP_CD: row.org_code,
              SHT_ANGLE_INFO: row.shot_angle,
              WGS84_LAT: String(row.lat),
              WGS84_LOT: String(row.lng),
            })),
          },
          totalCount: result.rows.length,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch CCTV from Turso:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
