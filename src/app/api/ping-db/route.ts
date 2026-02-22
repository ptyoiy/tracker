import { NextResponse } from "next/server";
import { turso } from "@/shared/lib/turso";

export async function GET() {
  const result = await turso.execute("SELECT 1 as value;");
  return NextResponse.json(result.rows);
}
