import ky from "ky";
import { NextResponse } from "next/server";
import { env } from "@/shared/config/env";

type KakaoAddressSearchResponse = {
  documents: Array<{
    address_name: string;
    x: string;
    y: string;
  }>;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const res = await ky
      .get("https://dapi.kakao.com/v2/local/search/address.json", {
        searchParams: { query },
        headers: { Authorization: `KakaoAK ${env.KAKAO_REST_API_KEY}` },
        timeout: 5000,
      })
      .json<KakaoAddressSearchResponse>();

    const results = res.documents.map((doc) => ({
      label: doc.address_name,
      address: doc.address_name,
      lat: Number(doc.y),
      lng: Number(doc.x),
      type: "address" as const,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
