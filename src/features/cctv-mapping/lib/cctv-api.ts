// src/features/cctv-mapping/lib/cctv-api.ts
import { useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { viewportAtom } from "@/features/map-view/model/atoms";
import { lastAnalysisParamsAtom } from "@/features/route-analysis/model/atoms";
import { coordToAddress } from "@/shared/api/kakao/geocoder";
import {
  fetchCctvInBounds,
  syncRegionCctv,
} from "@/shared/api/public-data/cctv";
import { findOpenAtmyCodeByAddress } from "@/shared/api/public-data/open-atmy-grp";
import { analyzeQueries } from "@/shared/api/queries";
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
  const lastParams = useAtomValue(lastAnalysisParamsAtom);

  // 경로 분석 결과 감시
  const { data: analysisData } = useQuery(
    analyzeQueries.segments(
      lastParams?.observations,
      lastParams?.futureMinutes,
    ),
  );

  // 1) 초기 4개 구역 선행 로딩 및 경로 주변 자동 로딩
  // biome-ignore lint/correctness/useExhaustiveDependencies: <최초 한번만 실행>
  useEffect(() => {
    const preSyncCodes = ["3220000", "3240000", "3210000", "3230000"];

    const loadBatch = async (codes: string[]) => {
      const wideBounds = {
        sw: { lat: 33, lng: 124 },
        ne: { lat: 39, lng: 132 },
      };

      setLoading(true);
      try {
        await Promise.all(
          codes.map(async (orgCode) => {
            if (loadedOrgCodes.has(orgCode)) return;
            await syncRegionCctv(orgCode);
            const data = await fetchCctvInBounds(wideBounds, orgCode);
            appendData({ orgCode, data });
          }),
        );
      } catch (e) {
        console.error("CCTV parallel load failed", e);
      } finally {
        setLoading(false);
      }
    };

    // 최초 1회 실행
    loadBatch(preSyncCodes);
  }, []);

  // 2) 경로 분석 완료 시 해당 경로 주변 지역구 데이터 로드
  useEffect(() => {
    if (!analysisData) return;

    const loadRouteRegions = async () => {
      // 모든 관측 지점의 지역구 코드 추출
      const targetCoords = analysisData.segments.flatMap((s) => [s.from, s.to]);
      const orgCodes = new Set<string>();

      for (const coord of targetCoords) {
        const address = await coordToAddress(coord.lat, coord.lng);
        const orgCode = address
          ? await findOpenAtmyCodeByAddress(address)
          : null;
        if (
          orgCode &&
          !orgCode.startsWith("6") &&
          !loadedOrgCodes.has(orgCode)
        ) {
          orgCodes.add(orgCode);
        }
      }

      if (orgCodes.size > 0) {
        setLoading(true);
        try {
          await Promise.all(
            Array.from(orgCodes).map(async (orgCode) => {
              await syncRegionCctv(orgCode);
              const data = await fetchCctvInBounds(
                {
                  sw: { lat: 33, lng: 124 },
                  ne: { lat: 39, lng: 132 },
                },
                orgCode,
              );
              appendData({ orgCode, data });
            }),
          );
        } finally {
          setLoading(false);
        }
      }
    };

    loadRouteRegions();
  }, [analysisData, appendData, loadedOrgCodes, setLoading]);

  // 3) 뷰포트 변화에 따른 CCTV 로드 (보조 로직)
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

        // '6'으로 시작하는 코드(광역 지자체 전체 코드 등)나 이미 로드된 경우 스킵
        if (!orgCode || orgCode.startsWith("6") || loadedOrgCodes.has(orgCode))
          return;

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
