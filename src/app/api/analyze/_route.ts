// // src/app/api/analyze/route.ts

// import { HTTPError } from "ky";
// import { type NextRequest, NextResponse } from "next/server";
// import { filterRoutesByTime } from "@/shared/api/analyze/filter";
// import { analyzeSegment } from "@/shared/api/analyze/segment";
// import { getTmapDrivingRoute } from "@/shared/api/tmap/driving";
// import { getTmapPedestrianRoute } from "@/shared/api/tmap/pedestrian";

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { observations } = analyzeRequestSchema.parse(body);

//     const sorted = [...observations];

//     const segments = [];

//     for (let i = 0; i < sorted.length - 1; i++) {
//       const from = sorted[i];
//       const to = sorted[i + 1];

//       const basic = analyzeSegment(from, to);
//       const routes = [];

//       // 도보 가능 시 TMAP 보행자 경로
//       if (basic.transportMode === "walking" || basic.avgSpeed < 15) {
//         try {
//           const pedestrianRoute = await getTmapPedestrianRoute(from, to);

//           const features = pedestrianRoute.features ?? [];

//           if (features.length > 0) {
//             // 0번 Feature(Point)의 properties에서 totalTime/totalDistance
//             const summaryProps = features[0].properties ?? {};

//             // LineString geometry만 모아서 polyline 구성
//             const lineCoords = features
//               .filter((f) => f.geometry?.type === "LineString")
//               .flatMap((f) => f.geometry.coordinates ?? []);

//             if (lineCoords.length > 0) {
//               routes.push({
//                 mode: "walking",
//                 polyline: lineCoords,
//                 estimatedDuration: summaryProps.totalTime ?? 0,
//                 distance: summaryProps.totalDistance ?? 0,
//               });
//             }
//           }
//         } catch (err) {
//           console.error("TMAP pedestrian error:", err);
//         }
//       }

//       // 차량 가능 시 TMAP 자동차 경로
//       if (basic.transportMode === "vehicle" || basic.avgSpeed >= 6) {
//         try {
//           const drivingRoute = await getTmapDrivingRoute(from, to);

//           const features = drivingRoute.features ?? [];

//           if (features.length > 0) {
//             const summaryProps = features[0].properties ?? {};

//             const lineCoords = features
//               .filter((f) => f.geometry?.type === "LineString")
//               .flatMap((f) => f.geometry.coordinates ?? []);

//             if (lineCoords.length > 0) {
//               routes.push({
//                 mode: "driving",
//                 polyline: lineCoords,
//                 estimatedDuration: summaryProps.totalTime ?? 0,
//                 distance: summaryProps.totalDistance ?? 0,
//               });
//             }
//           }
//         } catch (err) {
//           console.error("TMAP driving error:", err);
//         }
//       }

//       const validRoutes = filterRoutesByTime(routes, basic.duration);
//       segments.push({
//         from,
//         to,
//         distance: basic.distance,
//         duration: basic.duration,
//         avgSpeed: basic.avgSpeed,
//         transportMode: basic.transportMode,
//         routes: validRoutes,
//       });
//     }

//     return NextResponse.json({ segments });
//   } catch (error) {
//     if (error instanceof HTTPError) {
//       const body = await error.response.text();
//       console.error("Mapbox error status:", error.response.status);
//       console.error("Mapbox error body:", body);
//     }
//     console.error("Analyze error:", error);
//     return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
//   }
// }
