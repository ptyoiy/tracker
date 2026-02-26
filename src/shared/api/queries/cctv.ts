import { queryOptions } from "@tanstack/react-query";
import type { CCTV } from "@/types/cctv";
import { apiClient } from "../client";

export const cctvQueries = {
  all: () => ["cctv"] as const,

  nearby: (lat: number, lng: number, radius: number) =>
    queryOptions({
      queryKey: [...cctvQueries.all(), "nearby", { lat, lng, radius }] as const,
      queryFn: () =>
        apiClient
          .get("cctv-nearby", { searchParams: { lat, lng, radius } })
          .json<CCTV[]>(),
      staleTime: 10 * 60 * 1000, // CCTV 위치는 자주 안 바뀜
      enabled: !!lat && !!lng && radius > 0,
    }),
};
