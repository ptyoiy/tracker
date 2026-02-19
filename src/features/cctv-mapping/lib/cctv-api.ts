// src/features/cctv-mapping/lib/cctv-api.ts
"use client";

import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { fetchSeoulCctvSample } from "@/shared/api/public-data/cctv";
import { allCctvAtom } from "../model/atoms";

export function useLoadCctvOnce() {
  const setAll = useSetAtom(allCctvAtom);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchSeoulCctvSample();
        if (!cancelled) {
          setAll(data);
        }
      } catch (e) {
        console.error("Failed to load CCTV sample", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setAll]);
}
