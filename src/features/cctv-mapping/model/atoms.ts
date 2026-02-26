// src/features/cctv-mapping/model/atoms.ts
import { atom } from "jotai";
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

// 리스트 / 지도 공유 hover용 상태
export const hoveredCctvIdAtom = atom<string | null>(null);
