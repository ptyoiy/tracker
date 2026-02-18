// src/features/map-view/lib/useIsochrone.ts
"use client";

import { useAtom, useAtomValue } from "jotai";
import { useCallback } from "react";
import {
  futureMinutesAtom,
  observationsAtom,
} from "@/features/observation-input/model/atoms";
import { type IsochroneProfile, isochroneAtom } from "../model/atoms";

type IsochroneApiResponse = {
  polygons: { coordinates: number[][][] }[];
  fallbackUsed: boolean;
  errors: string | null;
};

export function useIsochrone() {
  const [isochrone, setIsochrone] = useAtom(isochroneAtom);
  const observations = useAtomValue(observationsAtom);
  const futureMinutes = useAtomValue(futureMinutesAtom);

  const computeIsochrone = useCallback(
    async (profile: IsochroneProfile) => {
      if (observations.length === 0) return;

      const last = observations[observations.length - 1];

      const body = {
        lat: last.lat,
        lng: last.lng,
        minutes: futureMinutes,
        profile,
      };

      const res = await fetch("/api/isochrone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as IsochroneApiResponse;

      if (!res.ok) {
        // 실패 시 상태만 초기화
        setIsochrone({
          profile,
          minutes: futureMinutes,
          polygons: [],
          fallbackUsed: true,
        });
        return;
      }

      setIsochrone({
        profile,
        minutes: futureMinutes,
        polygons: data.polygons.map((p) => p.coordinates),
        fallbackUsed: data.fallbackUsed,
      });
    },
    [observations, futureMinutes, setIsochrone],
  );

  return { isochrone, computeIsochrone };
}
