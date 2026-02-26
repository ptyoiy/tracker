import { queryOptions } from "@tanstack/react-query";
import type { IsochroneProfile, IsochroneResponse } from "@/types/isochrone";
import { apiClient } from "../client";

export const isochroneQueries = {
  all: () => ["isochrone"] as const,

  polygon: (
    lat: number,
    lng: number,
    minutes: number,
    profile: IsochroneProfile,
  ) =>
    queryOptions({
      queryKey: [
        ...isochroneQueries.all(),
        { lat, lng, minutes, profile },
      ] as const,
      queryFn: () =>
        apiClient
          .post("isochrone", { json: { lat, lng, minutes, profile } })
          .json<IsochroneResponse>(),
      staleTime: 5 * 60 * 1000, // 5분 캐시
      enabled: !!lat && !!lng && minutes > 0,
    }),
};
