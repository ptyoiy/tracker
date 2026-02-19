// describe("[API] /api/isochrone (실제 호출)", () => {
//   it("서울역 기준 도보 10분 isochrone을 성공적으로 반환한다", async () => {
//     // 환경변수 체크 (없으면 스킵)
//     if (!process.env.MAPBOX_ACCESS_TOKEN) {
//       console.warn(
//         "MAPBOX_ACCESS_TOKEN not set. Skipping /api/isochrone real test.",
//       );
//       return;
//     }

//     const res = await ky.post(`http://localhost:3000/api/isochrone`, {
//       json: {
//         lat: 37.5547,
//         lng: 126.9707,
//         minutes: 10,
//         profile: "walking",
//       },
//       timeout: 20000,
//     });

//     expect(res.status).toBe(200);

//     const body = await res.json<any>();
//     expect(body.type).toBe("FeatureCollection");
//     expect(Array.isArray(body.features)).toBe(true);
//     expect(body.features.length).toBeGreaterThan(0);
//   });
// });
