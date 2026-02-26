"use client";

import { useQuery } from "@tanstack/react-query";
import { isochroneQueries } from "@/shared/api/queries";
import type { IsochroneProfile } from "@/types/isochrone";

export function useIsochroneQuery(
  lat: number,
  lng: number,
  minutes: number,
  profile: IsochroneProfile,
) {
  return useQuery(isochroneQueries.polygon(lat, lng, minutes, profile));
}
