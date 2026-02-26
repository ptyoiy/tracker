"use client";

import { useQuery } from "@tanstack/react-query";
import { transitQueries } from "@/shared/api/queries";

export function useTransitNearby(lat: number, lng: number) {
  return useQuery(transitQueries.nearby(lat, lng));
}
