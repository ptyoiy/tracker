// src/features/cctv-mapping/lib/cctv-api.ts
"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { viewportAtom } from "@/features/map-view/model/atoms";
import { fetchCctvInBounds } from "@/shared/api/public-data/cctv";
import { allCctvAtom } from "../model/atoms";

export function useLoadCctvOnce() {
  const setAll = useSetAtom(allCctvAtom);
  const viewport = useAtomValue(viewportAtom);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const bounds = viewport ?? {
          sw: { lat: 37.54, lng: 126.96 },
          ne: { lat: 37.58, lng: 127.02 },
        };

        const data = await fetchCctvInBounds(bounds, 1, 100);
        if (!cancelled) {
          console.log({ data });
          setAll(data);
        }
      } catch (e) {
        console.error("Failed to load CCTV data", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setAll, viewport]);
}
