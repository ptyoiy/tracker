import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "../client";

// TODO: Define TransitNearbyResponse in @/types
type TransitNearbyResponse = unknown;

export const transitQueries = {
  all: () => ["transit"] as const,

  nearby: (lat: number, lng: number) =>
    queryOptions({
      queryKey: [...transitQueries.all(), "nearby", { lat, lng }] as const,
      queryFn: () =>
        apiClient
          .get("transit-nearby", { searchParams: { lat, lng } })
          .json<TransitNearbyResponse>(),
      staleTime: 30 * 1000, // 실시간 도착 정보이므로 30초
      enabled: !!lat && !!lng,
    }),
};
