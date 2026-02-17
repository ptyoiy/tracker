import ky from "ky";
import { NextResponse } from "next/server";
import { env } from "@/shared/config/env";

type KakaoKeywordResponse = {
  documents: Array<{
    place_name: string;
    road_address_name: string;
    address_name: string;
    x: string; // lng
    y: string; // lat
  }>;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const x = searchParams.get("x"); // optional: 중심 lng
  const y = searchParams.get("y"); // optional: 중심 lat

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const res = await ky
      .get("https://dapi.kakao.com/v2/local/search/keyword.json", {
        searchParams: {
          query,
          ...(x && y ? { x, y, radius: "5000" } : {}), // 필요 시 반경 5km
        },
        headers: { Authorization: `KakaoAK ${env.KAKAO_REST_API_KEY}` },
        timeout: 5000,
      })
      .json<KakaoKeywordResponse>();

    const results = res.documents.map((doc) => ({
      label: doc.place_name || doc.road_address_name || doc.address_name,
      address: doc.road_address_name || doc.address_name,
      lat: Number(doc.y),
      lng: Number(doc.x),
      type: "place" as const,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
