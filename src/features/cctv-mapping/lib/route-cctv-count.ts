// src/features/cctv-mapping/lib/route-cctv-count.ts
"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import {
  allRouteInfosAtom,
  routeCctvCountAtom,
} from "@/features/route-analysis/model/atoms";
import { allCctvAtom } from "../model/atoms";
import { filterCctvByContext } from "./buffer-filter";

export function useComputeRouteCctvCount() {
  const allCctv = useAtomValue(allCctvAtom);
  const allRoutes = useAtomValue(allRouteInfosAtom);
  const setCounts = useSetAtom(routeCctvCountAtom);

  useEffect(() => {
    if (!allCctv.length || !allRoutes.length) {
      setCounts({});
      return;
    }

    const next: Record<string, number> = {};

    for (const route of allRoutes) {
      const polyline = route.legs
        .flatMap((leg) => leg.polyline)
        .map((p) => [p.lng, p.lat] as [number, number]);

      const nearCctvs = filterCctvByContext(allCctv, {
        type: "ROUTE",
        polyline,
        bufferMeters: 100,
      });

      next[route.id] = nearCctvs.length;
    }

    setCounts(next);
  }, [allCctv, allRoutes, setCounts]);
}
