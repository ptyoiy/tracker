import { type NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  // TODO: Implement actual transit nearby fetching logic
  // This is a stub to prevent 404 errors in the frontend
  return NextResponse.json({
    stations: [],
    buses: [],
  });
}
