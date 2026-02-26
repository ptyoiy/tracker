"use client";

import { useQuery } from "@tanstack/react-query";
import { cctvQueries } from "@/shared/api/queries";

export function useCctvSearch(lat: number, lng: number, radius: number) {
  return useQuery(cctvQueries.nearby(lat, lng, radius));
}
