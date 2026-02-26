// src/features/map-view/lib/useMapLayers.ts
"use client";

import { useAtom } from "jotai";
import { useCallback, useState } from "react";
import { type MapLayerVisibility, mapLayersAtom } from "../model/atoms";

export function useMapLayers() {
  const [mapLayers, setMapLayers] = useAtom(mapLayersAtom);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

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

  return {
    mapLayers,
    isLayerMenuOpen,
    toggleLayer,
    toggleLayerMenu,
    closeLayerMenu,
  };
}
