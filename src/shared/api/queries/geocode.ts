import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "../client";

export const geocodeQueries = {
  all: () => ["geocode"] as const,

  reverse: (lat: number, lng: number) =>
    queryOptions({
      queryKey: [...geocodeQueries.all(), "reverse", { lat, lng }] as const,
      queryFn: () =>
        apiClient
          .get("geocode", { searchParams: { lat, lng } })
          .json<{ address: string; buildingName: string | null }>(),
      staleTime: Number.POSITIVE_INFINITY, // 좌표→주소는 불변
      enabled: !!lat && !!lng,
    }),
};
