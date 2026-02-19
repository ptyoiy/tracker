// app/api/geocode/route.ts

import ky from "ky";
import { NextResponse } from "next/server";
import { env } from "@/shared/config/env";

type KakaoAddressResponse = {
  documents: Array<{
    road_address?: { address_name: string };
    address?: { address_name: string };
  }>;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat,lng required" }, { status: 400 });
  }

  try {
    const res = await ky
      .get("https://dapi.kakao.com/v2/local/geo/coord2address.json", {
        searchParams: { x: lng, y: lat },
        headers: { Authorization: `KakaoAK ${env.KAKAO_REST_API_KEY}` },
        timeout: 5000,
      })
      .json<KakaoAddressResponse>();

    const doc = res.documents[0];
    const address =
      doc?.road_address?.address_name ?? doc?.address?.address_name ?? null;

    return NextResponse.json({ address });
    // biome-ignore lint/correctness/noUnusedVariables: <useless>
  } catch (e) {
    return NextResponse.json({ address: null }, { status: 200 });
  }
}
