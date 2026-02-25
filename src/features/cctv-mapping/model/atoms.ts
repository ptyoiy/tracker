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

// 선택 경로 주변 100m + 현재 뷰포트 안에 있는 CCTV만
export const filteredCctvAtom = atom<CCTV[]>((get) => {
  const all = get(allCctvAtom);
  const selectedRoutes = get(selectedRouteInfosAtom);
  const searchCenter = get(cctvSearchCenterAtom);
  const searchRadius = get(cctvSearchRadiusAtom);

  // 1. 독립 검색 모드인 경우 (검색 중심이 설정되어 있을 때)
  if (searchCenter) {
    return filterCctvByContext(all, {
      type: "RADIUS",
      center: [searchCenter.lng, searchCenter.lat],
      radiusMeters: searchRadius,
    });
  }

  // 2. 경로 분석 모드인 경우
  // 1) 경로가 선택되지 않았으면 아무것도 표시하지 않음 (사용성 개선)
  if (!all.length || selectedRoutes.length === 0) return [];

  const viewport = get(viewportAtom);

  let candidates = all;

  // 2) 선택된 경로 주변 100m로 1차 필터
  const polyline = selectedRoutes
    .flatMap((route) => route.legs.flatMap((leg) => leg.polyline))
    .map((p) => [p.lng, p.lat] as [number, number]);

  candidates = filterCctvByContext(candidates, {
    type: "ROUTE",
    polyline,
    bufferMeters: 100,
  });

  // 3) 뷰포트로 2차 제한 (현재 보이는 화면만)
  if (viewport) {
    const { sw, ne } = viewport;
    candidates = filterCctvByContext(candidates, {
      type: "VIEWPORT",
      bounds: { sw: [sw.lng, sw.lat], ne: [ne.lng, ne.lat] },
    });
  }

  return candidates;
});

// 리스트 / 지도 공유 hover용 상태
export const hoveredCctvIdAtom = atom<string | null>(null);
