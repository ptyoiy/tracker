// src/features/map-view/lib/useMapInteraction.ts
"use client";

import { observationsAtom } from "@/features/observation-input/model/atoms";
import { fullGeocode } from "@/shared/api/kakao/geocoder";
import { useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";
import { activePopupAtom } from "../model/atoms";

export function useMapInteraction(
  panToWithOffset: (lat: number, lng: number) => void,
) {
  const setObservations = useSetAtom(observationsAtom);
  const [activePopup, setActivePopup] = useAtom(activePopupAtom);

  const handleMapClick = useCallback(
    async (_t: kakao.maps.Map, mouseEvent: kakao.maps.event.MouseEvent) => {
      if (activePopup) {
        setActivePopup(null);
        return;
      }

      const latlng = mouseEvent.latLng;
      const lat = latlng.getLat();
      const lng = latlng.getLng();
      panToWithOffset(lat, lng);
      const { address, buildingName } = await fullGeocode(lat, lng);

      setObservations((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          lat,
          lng,
          timestamp: new Date().toISOString(),
          label: buildingName || address || "지정된 위치",
          address: address ?? "",
        },
      ]);
    },
    [activePopup, setActivePopup, setObservations, panToWithOffset],
  );

  return { handleMapClick };
}
