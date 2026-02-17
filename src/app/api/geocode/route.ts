// src/app/api/geocode/route.ts

import ky from "ky"; // Assuming ky is available
import { NextResponse } from "next/server";

// This is a placeholder for the Kakao Local API call.
// You will need to obtain a Kakao API key and configure it securely (e.g., via environment variables).
const KAKAO_API_URL = "https://dapi.kakao.com/v2/local/geo/coord2address.json";
const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY; // Ensure this is set in your .env.local

export async function POST(request: Request) {
  if (!KAKAO_API_KEY) {
    console.error("KAKAO_API_KEY is not set.");
    return NextResponse.json(
      { error: "Kakao API key not configured" },
      { status: 500 },
    );
  }

  try {
    const { lat, lng } = await request.json();

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 },
      );
    }

    const response = await ky.get(KAKAO_API_URL, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_API_KEY}`,
      },
      searchParams: {
        x: lng, // Kakao API uses x for longitude, y for latitude
        y: lat,
        inputCoordId: "WGS84", // WGS84 is standard GPS coordinate system
        output: "json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Kakao API error: ${response.status} - ${errorBody}`);
      return NextResponse.json(
        { error: "Failed to fetch address from Kakao API" },
        { status: response.status },
      );
    }

    const data = await response.json();
    console.log("Kakao API response:", { data });

    // Kakao API response structure for coord2address might vary. Inspect it.
    // Typically, it's in data.documents[0].address.address_name
    if (
      data.documents &&
      data.documents.length > 0 &&
      data.documents[0].address
    ) {
      const address = data.documents[0].address.address_name;
      return NextResponse.json({ address });
    }

    return NextResponse.json(
      { error: "Address not found for the given coordinates" },
      { status: 404 },
    );
  } catch (error: any) {
    console.error("Error in geocode API route:", error);
    return NextResponse.json(
      { error: error.message || "An internal error occurred" },
      { status: 500 },
    );
  }
}
