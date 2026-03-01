import { useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { apiClient } from "@/shared/api/client";
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

  const [, setResult] = useAtom(transitResultAtom);
  const [, setLoading] = useAtom(transitLoadingAtom);
  const [, setError] = useAtom(transitErrorAtom);

  // 현재 시각 가져오기 (매 렌더링마다 달라지는 것을 방지하기 위해 훅 호출 시점 고정은 피하지만, 쿼리 키엔 포함)
  // undefined면 API 서버에서 현재 시각을 기준으로 사용
  const reqTime = referenceTime || new Date().toISOString();

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
  });

  // Jotai atoms와 React Query 상태 동기화 (레거시 코드 등에서 Jotai atom을 직접 읽는 경우를 위해)
  useEffect(() => {
    setLoading(query.isLoading || query.isFetching);
    if (query.data) setResult(query.data);
    setError(query.error ? query.error.message : null);
  }, [
    query.isLoading,
    query.isFetching,
    query.data,
    query.error,
    setResult,
    setLoading,
    setError,
  ]);

  return {
    data: query.data,
    isLoading: query.isLoading || query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
