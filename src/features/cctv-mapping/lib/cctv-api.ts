// src/features/cctv-mapping/lib/cctv-api.ts
"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { viewportAtom } from "@/features/map-view/model/atoms";
import { coordToAddress } from "@/shared/api/kakao/geocoder";
import {
  fetchCctvInBounds,
  syncRegionCctv,
} from "@/shared/api/public-data/cctv";
import { findOpenAtmyCodeByAddress } from "@/shared/api/public-data/open-atmy-grp";
import {
  appendCctvDataAtom,
  cctvLoadingAtom,
  loadedOrgCodesAtom,
} from "../model/atoms";

export function useLoadCctvOnce() {
  const loadedOrgCodes = useAtomValue(loadedOrgCodesAtom);
  const appendData = useSetAtom(appendCctvDataAtom);
  const setLoading = useSetAtom(cctvLoadingAtom);
  const viewport = useAtomValue(viewportAtom);

  useEffect(() => {
    let cancelled = false;
    let timerId: NodeJS.Timeout;

    const loadData = async () => {
      try {
        const bounds = viewport ?? {
          sw: { lat: 37.54, lng: 126.96 },
          ne: { lat: 37.58, lng: 127.02 },
        };

        const centerLat = (bounds.sw.lat + bounds.ne.lat) / 2;
        const centerLng = (bounds.sw.lng + bounds.ne.lng) / 2;

        const address = await coordToAddress(centerLat, centerLng);
        const orgCode = address
          ? await findOpenAtmyCodeByAddress(address)
          : null;

        if (!orgCode || loadedOrgCodes.has(orgCode)) return;

        // 🟡 로딩 시작
        setLoading(true);

        if (!cancelled) {
          await syncRegionCctv(orgCode);
          const data = await fetchCctvInBounds(bounds, orgCode);

          if (!cancelled) {
            appendData({ orgCode, data });
          }
        }
      } catch (e) {
        console.error("Failed to load CCTV data", e);
      } finally {
        if (!cancelled) {
          // ⚪ 로딩 종료
          setLoading(false);
        }
      }
    };

    // Debounce: 뷰포트가 바뀌고 500ms 후에 로드 시작
    timerId = setTimeout(loadData, 500);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
    };
  }, [viewport, loadedOrgCodes, appendData, setLoading]);
}
