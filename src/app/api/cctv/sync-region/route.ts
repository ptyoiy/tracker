import { type NextRequest, NextResponse } from "next/server";
import { syncRegionCctv } from "@/features/cctv-mapping/lib/cctv-sync";

export async function POST(req: NextRequest) {
  try {
    const { orgCode } = await req.json();

    if (!orgCode) {
      return NextResponse.json(
        { error: "orgCode is required" },
        { status: 400 },
      );
    }

    const result = await syncRegionCctv(orgCode);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Sync failed:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
