import { activePopupAtom } from "@/features/map-view/model/atoms";
import { apiClient } from "@/shared/api/client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import {
  transitErrorAtom,
  transitLoadingAtom,
  transitLocationAtom,
  transitReferenceTimeAtom,
  transitResultAtom,
  transitSelectedModeAtom,
} from "../model/atoms";
import type {
  TransitNearbyRequest,
  TransitNearbyResponse,
} from "../model/types";

export function useTransitNearby() {
  const location = useAtomValue(transitLocationAtom);
  const referenceTime = useAtomValue(transitReferenceTimeAtom);
  const selectedMode = useAtomValue(transitSelectedModeAtom);
  const activePopup = useAtomValue(activePopupAtom);

  const [, setResult] = useAtom(transitResultAtom);
  const [, setLoading] = useAtom(transitLoadingAtom);
  const [, setError] = useAtom(transitErrorAtom);

  const reqTime = referenceTime || new Date().toISOString();

  // 실시간 모드 판별: referenceTime이 현재에서 15분 이내면 실시간
  const isRealtimeMode = (() => {
    if (selectedMode === "timetable") return false;
    if (selectedMode === "realtime") return true;
    const diff = Math.abs(new Date(reqTime).getTime() - Date.now());
    return diff <= 15 * 60 * 1000;
  })();

  // 팝업이 열려있는지 확인
  const isTransitPopupOpen =
    activePopup?.type === "transit-bus" ||
    activePopup?.type === "transit-subway";

  const query = useQuery({
    queryKey: [
      "transit-nearby",
      location?.lat,
      location?.lng,
      reqTime,
      selectedMode,
    ],
    queryFn: async () => {
      if (!location) return null;

      const body: TransitNearbyRequest & { forceMode?: typeof selectedMode } = {
        lat: location.lat,
        lng: location.lng,
        referenceTime: reqTime,
      };

      if (selectedMode !== "auto") {
        body.forceMode = selectedMode;
      }

      return apiClient
        .post("transit-nearby", { json: body })
        .json<TransitNearbyResponse>();
    },
    enabled: !!location,
    staleTime: 30000,
    // 갱신 중에도 이전 데이터를 유지하여 로딩 깜빡임 방지
    placeholderData: keepPreviousData,
    // 실시간 모드이고 패널이 보이거나 팝업이 열려있으면 20초마다 자동 갱신
    refetchInterval:
      isRealtimeMode && (!!location || isTransitPopupOpen) ? 20000 : false,
  });

  // Jotai atoms와 React Query 상태 동기화 (레거시 코드 등에서 Jotai atom을 직접 읽는 경우를 위해)
  useEffect(() => {
    // 초기 로딩(데이터 없음)만 loading으로 표시, 갱신 중에는 false 유지
    setLoading(query.isLoading);
    if (query.data) setResult(query.data);
    setError(query.error ? query.error.message : null);
  }, [
    query.isLoading,
    query.data,
    query.error,
    setResult,
    setLoading,
    setError,
  ]);

  return {
    data: query.data,
    isLoading: query.isLoading, // 초기 로딩 (데이터 없을 때만)
    isFetching: query.isFetching, // 갱신 중 (백그라운드 포함)
    error: query.error,
    refetch: query.refetch,
  };
}
