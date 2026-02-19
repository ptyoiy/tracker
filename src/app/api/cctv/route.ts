// app/api/cctv/route.ts (Next.js 15 App Router 기준)

import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/shared/config/env";

const CCTV_BASE_URL = "https://apis.data.go.kr/1741000/cctv_info/info";

export async function GET(req: NextRequest) {
  const apiKey = env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CCTV_API_KEY missing" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(req.url);

  // 클라이언트가 넘긴 파라미터들: bounds, page, rows, cond 코드 등
  const page = searchParams.get("pageNo") ?? "1";
  const numOfRows = searchParams.get("numOfRows") ?? "100";
  const opnCode = searchParams.get("opnCode"); // cond[OPN_ATMY_GRP_CD::EQ]에 넣을 값

  const upstreamParams = new URLSearchParams({
    serviceKey: apiKey,
    pageNo: page,
    numOfRows,
    returnType: "json",
  });

  if (opnCode) {
    upstreamParams.set("cond[OPN_ATMY_GRP_CD::EQ]", opnCode);
  }

  const upstreamUrl = `${CCTV_BASE_URL}?${upstreamParams.toString()}`;

  const res = await fetch(upstreamUrl);
  if (!res.ok) {
    return NextResponse.json(
      { error: "Upstream CCTV API error" },
      { status: 502 },
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
