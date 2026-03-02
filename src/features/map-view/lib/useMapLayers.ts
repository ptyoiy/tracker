// src/features/map-view/lib/useMapLayers.ts
"use client";

import { useAtom, useAtomValue } from "jotai";
import { useCallback, useState } from "react";
import {
  type MapLayerVisibility,
  cctvPurposeFilterAtom,
  cctvPurposesAtom,
  mapLayersAtom,
} from "../model/atoms";

export function useMapLayers() {
  const [mapLayers, setMapLayers] = useAtom(mapLayersAtom);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const cctvPurposes = useAtomValue(cctvPurposesAtom);
  const [cctvPurposeFilter, setCctvPurposeFilter] = useAtom(
    cctvPurposeFilterAtom,
  );

  const toggleLayer = useCallback(
    (layer: keyof MapLayerVisibility) => {
      setMapLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
    },
    [setMapLayers],
  );

  const toggleLayerMenu = useCallback(() => {
    setIsLayerMenuOpen((prev) => !prev);
  }, []);

  const closeLayerMenu = useCallback(() => {
    setIsLayerMenuOpen(false);
  }, []);

  const toggleCctvPurpose = useCallback(
    (purpose: string) => {
      setCctvPurposeFilter((prev) => {
        const next = new Set(prev);
        if (next.has(purpose)) {
          next.delete(purpose);
        } else {
          next.add(purpose);
        }
        return next;
      });
    },
    [setCctvPurposeFilter],
  );

  const toggleAllCctvPurposes = useCallback(() => {
    setCctvPurposeFilter((prev) => {
      // 전부 숨겨진 상태면 → 전체 표시 (빈 Set)
      // 그렇지 않으면 → 전부 숨기기 (모든 목적 추가)
      if (prev.size > 0 && prev.size >= cctvPurposes.length) {
        return new Set<string>();
      }
      return new Set<string>(cctvPurposes);
    });
  }, [setCctvPurposeFilter, cctvPurposes]);

  return {
    mapLayers,
    isLayerMenuOpen,
    toggleLayer,
    toggleLayerMenu,
    closeLayerMenu,
    cctvPurposes,
    cctvPurposeFilter,
    toggleCctvPurpose,
    toggleAllCctvPurposes,
  };
}
