// src/features/map-view/ui/MapView.tsx
"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  CustomOverlayMap,
  Map as KakaoMap,
  MapMarker,
} from "react-kakao-maps-sdk";
import { useLoadCctvOnce } from "@/features/cctv-mapping/lib/cctv-api";
import { useComputeRouteCctvCount } from "@/features/cctv-mapping/lib/route-cctv-count";
import { observationsAtom } from "@/features/observation-input/model/atoms";
import { coordToAddress } from "@/shared/api/kakao/geocoder";
import { DEFAULT_CENTER } from "@/shared/config/constant";
import { viewportAtom } from "../model/atoms";
import { CCTVMarkers } from "./CCTVMarker";
import { IsochronePolygon } from "./IsoChronePolygon";
import { IsochroneControls } from "./IsochroneControls";
import { RoutePolyline } from "./RoutePolyLine";

export function MapView() {
  const observations = useAtomValue(observationsAtom);
  const setObservations = useSetAtom(observationsAtom);
  const setViewport = useSetAtom(viewportAtom);

  useComputeRouteCctvCount();
  useLoadCctvOnce();

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

  const handleIdle = (map: kakao.maps.Map) => {
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    setViewport({
      sw: { lat: sw.getLat(), lng: sw.getLng() },
      ne: { lat: ne.getLat(), lng: ne.getLng() },
    });
  };

  return (
    <>
      <IsochroneControls />
      <KakaoMap
        center={last ? { lat: last.lat, lng: last.lng } : DEFAULT_CENTER}
        style={{ width: "100%", height: "100%" }}
        level={7}
        onClick={handleMapClick}
        onIdle={handleIdle}
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

        <RoutePolyline />
        <IsochronePolygon />
        <CCTVMarkers />
      </KakaoMap>
    </>
  );
}
