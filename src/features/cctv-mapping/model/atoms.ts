// src/features/cctv-mapping/model/atoms.ts
import { atom } from "jotai";
import { viewportAtom } from "@/features/map-view/model/atoms";
import { selectedRouteInfosAtom } from "@/features/route-analysis/model/atoms";
import type { CCTV } from "@/types/cctv";
import { filterCctvByContext } from "../lib/buffer-filter";

export const allCctvAtom = atom<CCTV[]>([]);

// 선택 경로 주변 100m + 현재 뷰포트 안에 있는 CCTV만
export const filteredCctvAtom = atom<CCTV[]>((get) => {
  const all = get(allCctvAtom);
  console.log({ all });
  if (!all.length) return [];

  const viewport = get(viewportAtom);
  const selectedRoutes = get(selectedRouteInfosAtom);

  let candidates = all;

  // 1) 뷰포트로 1차 제한
  if (viewport) {
    const { sw, ne } = viewport;
    candidates = filterCctvByContext(candidates, {
      type: "VIEWPORT",
      bounds: { sw: [sw.lng, sw.lat], ne: [ne.lng, ne.lat] },
    });
  }

  // 2) 선택된 경로 주변 100m로 2차 필터
  if (selectedRoutes.length > 0) {
    const polyline = selectedRoutes
      .flatMap((route) => route.legs.flatMap((leg) => leg.polyline))
      .map((p) => [p.lng, p.lat] as [number, number]);

    candidates = filterCctvByContext(candidates, {
      type: "ROUTE",
      polyline,
      bufferMeters: 100,
    });
  }

  return candidates;
});

// 리스트 / 지도 공유 hover용 상태
export const hoveredCctvIdAtom = atom<string | null>(null);
