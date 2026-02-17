// // src/app/api/isochrone/route.ts

// import ky, { HTTPError } from "ky";
// import { type NextRequest, NextResponse } from "next/server";
// import { z } from "zod";

// const isochroneRequestSchema = z.object({
//   lat: z.number(),
//   lng: z.number(),
//   minutes: z.number().min(1).max(60),
//   profile: z.enum(["walking", "driving", "cycling"]).default("walking"),
// });

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { lat, lng, minutes, profile } = isochroneRequestSchema.parse(body);

//     const mapboxProfile =
//       profile === "driving"
//         ? "driving"
//         : profile === "cycling"
//           ? "cycling"
//           : "walking";

//     const url = `https://api.mapbox.com/isochrone/v1/mapbox/${mapboxProfile}/${lng},${lat}`;

//     const geojson = await ky
//       .get(url, {
//         searchParams: {
//           contours_minutes: minutes,
//           polygons: "true",
//           access_token: process.env.MAPBOX_ACCESS_TOKEN,
//         },
//         timeout: 10000,
//       })
//       .json();

//     return NextResponse.json(geojson);
//   } catch (error) {
//     if (error instanceof HTTPError) {
//       const body = await error.response.text();
//       console.error("Mapbox error status:", error.response.status);
//       console.error("Mapbox error body:", body);
//     }
//     return NextResponse.json({ error: "Isochrone failed" }, { status: 500 });
//   }
// }
