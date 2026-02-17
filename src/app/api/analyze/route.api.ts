// describe("[API] /api/analyze (실제 TMAP 호출)", () => {
//   it("서울역→시청 구간에 대해 세그먼트와 경로를 반환한다", async () => {
//     if (!process.env.TMAP_APP_KEY) {
//       console.warn("TMAP_APP_KEY not set. Skipping /api/analyze real test.");
//       return;
//     }

//     const res = await ky.post(`http://localhost:3000/api/analyze`, {
//       json: {
//         observations: [
//           {
//             lat: 37.5547,
//             lng: 126.9707, // 서울역
//             timestamp: "2026-02-10T00:00:00.000Z",
//           },
//           {
//             lat: 37.5663,
//             lng: 126.9779, // 시청 근처
//             timestamp: "2026-02-10T00:15:00.000Z",
//           },
//         ],
//         futureMinutes: 10,
//       },
//       timeout: 20000,
//     });

//     expect(res.status).toBe(200);

//     const body = await res.json<any>();
//     expect(Array.isArray(body.segments)).toBe(true);
//     expect(body.segments.length).toBe(1);
//     const seg = body.segments[0];
//     expect(seg.routes.length).toBeGreaterThan(0);
//   });
// });
