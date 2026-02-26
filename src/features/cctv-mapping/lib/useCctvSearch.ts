"use client";

import { useAtom, useSetAtom } from "jotai";
import { coordToAddress } from "@/shared/api/kakao/geocoder";
import {
  fetchCctvInBounds,
  syncRegionCctv,
} from "@/shared/api/public-data/cctv";
import { findOpenAtmyCodeByAddress } from "@/shared/api/public-data/open-atmy-grp";
import {
  appendCctvDataAtom,
  cctvLoadingAtom,
  cctvSearchCenterAtom,
  cctvSearchRadiusAtom,
} from "../model/atoms";

export function useCctvSearch() {
  const [searchCenter, setSearchCenter] = useAtom(cctvSearchCenterAtom);
  const [radius, setRadius] = useAtom(cctvSearchRadiusAtom);
  const appendData = useSetAtom(appendCctvDataAtom);
  const setLoading = useSetAtom(cctvLoadingAtom);

  const searchNearby = async (lat: number, lng: number) => {
    setLoading(true);
    setSearchCenter({ lat, lng });

    try {
      // 1. 역지오코딩으로 주소 획득
      const address = await coordToAddress(lat, lng);
      if (!address) {
        console.warn("Address not found for coordinates");
        return;
      }

      // 2. 지역구 코드 찾기
      const orgCode = await findOpenAtmyCodeByAddress(address);
      if (!orgCode) {
        console.warn("Organization code not found for address:", address);
        return;
      }

      // 3. 해당 지역구 CCTV 동기화 및 데이터 로드
      await syncRegionCctv(orgCode);

      // 검색 범위를 넉넉하게 잡기 위해 (radius + @)의 bounds 계산
      // 여기서는 단순히 해당 지역구 전체를 가져와서 atom의 filter에서 radius로 거름
      const bounds = {
        sw: { lat: lat - 0.02, lng: lng - 0.02 },
        ne: { lat: lat + 0.02, lng: lng + 0.02 },
      };

      const data = await fetchCctvInBounds(bounds, orgCode);
      appendData({ orgCode, data });
    } catch (error) {
      console.error("CCTV search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    searchCenter,
    setSearchCenter,
    radius,
    setRadius,
    searchNearby,
  };
}
