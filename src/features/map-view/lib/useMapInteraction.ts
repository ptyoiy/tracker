// src/features/map-view/lib/useMapInteraction.ts
"use client";

import { observationsAtom } from "@/features/observation-input/model/atoms";
import { fullGeocode } from "@/shared/api/kakao/geocoder";
import { useAtom, useSetAtom, useStore } from "jotai";
import { useCallback } from "react";
import { activePopupAtom, isochroneSelectionAtom } from "../model/atoms";

export function useMapInteraction(
  panToWithOffset: (lat: number, lng: number) => void,
) {
  const store = useStore();
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

      setObservations((prev) => {
        const next = [
          ...prev,
          {
            id: crypto.randomUUID(),
            lat,
            lng,
            timestamp: new Date().toISOString(),
            label: buildingName || address || "지정된 위치",
            address: address ?? "",
          },
        ];

        // 동기적으로 상태가 업데이트되는 건 아니지만, 다음 렌더에 반영됨
        // 혹은 바로 store 로 세팅
        store.set(isochroneSelectionAtom, (iso) => ({
          ...iso,
          observationIndex: next.length - 1,
        }));
        return next;
      });
    },
    [activePopup, setActivePopup, setObservations, panToWithOffset, store],
  );

  return { handleMapClick };
}
