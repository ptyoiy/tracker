// src/features/map-view/lib/useMapInteraction.ts
"use client";

import { useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";
import { observationsAtom } from "@/features/observation-input/model/atoms";
import {
  transitLookupEndAtom,
  transitLookupPickingAtom,
  transitLookupStartAtom,
} from "@/features/transit-lookup/model/atoms";
import { fullGeocode } from "@/shared/api/kakao/geocoder";
import { activePopupAtom } from "../model/atoms";

export function useMapInteraction(
  panToWithOffset: (lat: number, lng: number) => void,
) {
  const setObservations = useSetAtom(observationsAtom);
  const [activePopup, setActivePopup] = useAtom(activePopupAtom);
  const [picking, setPicking] = useAtom(transitLookupPickingAtom);
  const setTransitStart = useSetAtom(transitLookupStartAtom);
  const setTransitEnd = useSetAtom(transitLookupEndAtom);

  const handleMapClick = useCallback(
    async (_t: kakao.maps.Map, mouseEvent: kakao.maps.event.MouseEvent) => {
      if (activePopup) {
        setActivePopup(null);
        return;
      }

      const latlng = mouseEvent.latLng;
      const lat = latlng.getLat();
      const lng = latlng.getLng();

      if (picking) {
        if (picking === "start") setTransitStart({ lat, lng });
        else setTransitEnd({ lat, lng });
        setPicking(null);
        panToWithOffset(lat, lng);
        return;
      }

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
    [
      activePopup,
      setActivePopup,
      picking,
      setPicking,
      setTransitStart,
      setTransitEnd,
      setObservations,
      panToWithOffset,
    ],
  );

  return { handleMapClick };
}
