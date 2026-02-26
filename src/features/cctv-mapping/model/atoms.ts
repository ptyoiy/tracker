// src/features/cctv-mapping/model/atoms.ts
import { atom } from "jotai";
import { viewportAtom } from "@/features/map-view/model/atoms";
import { selectedRouteInfosAtom } from "@/features/route-analysis/model/atoms";
import type { CCTV } from "@/types/cctv";
import { filterCctvByContext } from "../lib/buffer-filter";

// 실제 메모리에 보관 중인 모든 CCTV (누적)
export const allCctvAtom = atom<CCTV[]>([]);

// 이미 로드 완료된 지역 코드(orgCode) 목록
export const loadedOrgCodesAtom = atom<Set<string>>(new Set<string>());

// 로딩 상태를 관리하는 Atom
export const cctvLoadingAtom = atom<boolean>(false);

// 새로운 지역 데이터를 추가하는 쓰기 전용 Atom
export const appendCctvDataAtom = atom(
  null,
  (get, set, { orgCode, data }: { orgCode: string; data: CCTV[] }) => {
    const loaded = get(loadedOrgCodesAtom);
    if (loaded.has(orgCode)) return;

    // 1. 이미 로드된 코드에 추가
    const nextLoaded = new Set(loaded);
    nextLoaded.add(orgCode);
    set(loadedOrgCodesAtom, nextLoaded);

    // 2. 전체 데이터에 중복 없이 추가 (ID 기준)
    const currentAll = get(allCctvAtom);
    const currentIds = new Set(currentAll.map((c) => c.id));
    const newData = data.filter((c) => !currentIds.has(c.id));

    set(allCctvAtom, [...currentAll, ...newData]);
  },
);

// 독립 검색 모드용 Atom
export const cctvSearchCenterAtom = atom<{ lat: number; lng: number } | null>(
  null,
);
export const cctvSearchRadiusAtom = atom<number>(200); // 기본 반경 200m

// 독립 검색 모드용 CCTV 결과
export const manualSearchCctvAtom = atom<CCTV[]>((get) => {
  const all = get(allCctvAtom);
  const searchCenter = get(cctvSearchCenterAtom);
  const searchRadius = Math.min(get(cctvSearchRadiusAtom), 1500); // 1500m 제한

  if (!searchCenter) return [];

  return filterCctvByContext(all, {
    type: "RADIUS",
    center: [searchCenter.lng, searchCenter.lat],
    radiusMeters: searchRadius,
  });
});

// 경로 기반 자동 검색 CCTV 결과
export const routeCctvAtom = atom<CCTV[]>((get) => {
  const all = get(allCctvAtom);
  const selectedRoutes = get(selectedRouteInfosAtom);
  const viewport = get(viewportAtom);

  if (!all.length || selectedRoutes.length === 0) return [];

  const polyline = selectedRoutes
    .flatMap((route) => route.legs.flatMap((leg) => leg.polyline))
    .map((p) => [p.lng, p.lat] as [number, number]);

  let candidates = filterCctvByContext(all, {
    type: "ROUTE",
    polyline,
    bufferMeters: 100,
  });

  if (viewport) {
    const { sw, ne } = viewport;
    // 250m 버퍼 추가 (약 0.00225도)
    const BUFFER = 0.00225;
    candidates = filterCctvByContext(candidates, {
      type: "VIEWPORT",
      bounds: {
        sw: [sw.lng - BUFFER, sw.lat - BUFFER],
        ne: [ne.lng + BUFFER, ne.lat + BUFFER],
      },
    });
  }

  return candidates;
});

// 전체 지도에 표시할 CCTV (두 레이어 합침, 중복 제거)
export const filteredCctvAtom = atom<CCTV[]>((get) => {
  const manual = get(manualSearchCctvAtom);
  const route = get(routeCctvAtom);

  // 수동 검색 중이면 수동 검색 결과만 보여줄지, 합쳐서 보여줄지 결정
  // "검색 시 해당 반경 내 CCTV만 지도에 표시" -> 수동 검색 활성화 시 수동 검색만?
  // 하지만 "별도 레이어" -> 둘 다 보여주되 시각적으로 구분?
  // 여기서는 합치되 수동 검색이 있으면 그것을 우선시하거나 둘 다 보여줌.
  // 사용자의 명확한 요구사항인 "해당 반경 내 CCTV만 지도에 표시"를 따라 수동 검색 시 수동 검색만 반환.
  if (manual.length > 0 || get(cctvSearchCenterAtom)) {
    return manual;
  }

  return route;
});

// 리스트 / 지도 공유 hover용 상태
export const hoveredCctvIdAtom = atom<string | null>(null);
