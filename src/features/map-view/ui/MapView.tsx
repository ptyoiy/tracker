// src/features/map-view/ui/MapView.tsx
// src/features/map-view/ui/MapView.tsx
"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  CustomOverlayMap,
  Map as KakaoMap,
  MapMarker,
} from "react-kakao-maps-sdk";
import { observationsAtom } from "@/features/observation-input/model/atoms";
import { coordToAddress } from "@/shared/api/kakao/geocoder";
import { DEFAULT_CENTER } from "@/shared/config/constant";
import { CCTVMarkers } from "./CCTVMarker";
import { IsochronePolygon } from "./IsoChronePolygon";
import { IsochroneControls } from "./IsochroneControls";
import { RoutePolyline } from "./RoutePolyLine";

export function MapView() {
  const observations = useAtomValue(observationsAtom);
  const setObservations = useSetAtom(observationsAtom);

  const last = observations[observations.length - 1];

  const handleMapClick = async (
    _t: kakao.maps.Map,
    mouseEvent: kakao.maps.event.MouseEvent,
  ) => {
    const latlng = mouseEvent.latLng;
    const lat = latlng.getLat();
    const lng = latlng.getLng();

    const address = await coordToAddress(lat, lng);

    setObservations((prev) => [
      ...prev,
      {
        lat,
        lng,
        timestamp: new Date().toISOString(),
        label: address ?? "",
        address: address ?? "",
      },
    ]);
  };

  return (
    <>
      <IsochroneControls />
      <KakaoMap
        center={last ? { lat: last.lat, lng: last.lng } : DEFAULT_CENTER}
        style={{ width: "100%", height: "100%" }}
        level={7}
        onClick={handleMapClick}
      >
        {observations.map((obs, idx) => (
          <div key={`${obs.lat}-${obs.lng}-${obs.timestamp}`}>
            <MapMarker position={{ lat: obs.lat, lng: obs.lng }} />

            <CustomOverlayMap
              position={{ lat: obs.lat, lng: obs.lng }}
              xAnchor={0.5}
              yAnchor={1.75}
            >
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-black/80 text-[10px] text-white leading-none">
                {idx + 1}
              </div>
            </CustomOverlayMap>
          </div>
        ))}
        {/* 선택된 TMAP 경로 라인 */}
        <RoutePolyline />

        {/* Isochrone/CCTV */}
        <IsochronePolygon />
        <CCTVMarkers />
      </KakaoMap>
    </>
  );
}
