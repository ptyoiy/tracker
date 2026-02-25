import { type NextRequest, NextResponse } from "next/server";
import { getTransitRoute } from "@/shared/api/tmap/transit";

export async function POST(request: NextRequest) {
  try {
    const { startX, startY, endX, endY, searchDttm } = await request.json();

    if (!startX || !startY || !endX || !endY) {
      return NextResponse.json(
        { error: "출발지와 목적지 좌표가 필요합니다." },
        { status: 400 },
      );
    }

    const route = await getTransitRoute(
      { lat: startY, lng: startX },
      { lat: endY, lng: endX },
      searchDttm,
    );

    if (!route) {
      return NextResponse.json(
        { error: "해당 조건의 대중교통 경로를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json(route);
  } catch (error) {
    console.error("Transit lookup error:", error);
    return NextResponse.json(
      { error: "대중교통 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
