// src/features/map-view/ui/MapView.tsx
"use client";

import { useLoadCctvOnce } from "@/features/cctv-mapping/lib/cctv-api";
import { useComputeRouteCctvCount } from "@/features/cctv-mapping/lib/route-cctv-count";
import { cctvLoadingAtom } from "@/features/cctv-mapping/model/atoms";
import { observationsAtom } from "@/features/observation-input/model/atoms";
import { coordToAddress } from "@/shared/api/kakao/geocoder";
import { DEFAULT_CENTER } from "@/shared/config/constant";
import { Badge } from "@/shared/ui/badge";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { Map as KakaoMap } from "react-kakao-maps-sdk";
import { activePopupAtom, viewportAtom } from "../model/atoms";
import { CCTVMarkers } from "./CCTVMarker";
import { IsochronePolygon } from "./IsoChronePolygon";
import { IsochroneControls } from "./IsochroneControls";
import { ObservationMarker } from "./ObservationMarker";
import { RoutePolyline } from "./RoutePolyLine";

export function MapView() {
  const observations = useAtomValue(observationsAtom);
  const isCctvLoading = useAtomValue(cctvLoadingAtom);
  const setObservations = useSetAtom(observationsAtom);
  const setViewport = useSetAtom(viewportAtom);
  const [activePopup, setActivePopup] = useAtom(activePopupAtom);

  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);

  useLoadCctvOnce();
  useComputeRouteCctvCount();

  // 관측 지점이 추가될 때만 지도를 마지막 지점으로 이동
  useEffect(() => {
    const last = observations[observations.length - 1];
    if (last) {
      setMapCenter({ lat: last.lat, lng: last.lng });
    }
  }, [observations]);

  const handleMapClick = async (
    _t: kakao.maps.Map,
    mouseEvent: kakao.maps.event.MouseEvent,
  ) => {
    if (activePopup) {
      setActivePopup(null);
      return;
    }

    const latlng = mouseEvent.latLng;
    const lat = latlng.getLat();
    const lng = latlng.getLng();

    const address = await coordToAddress(lat, lng);

    setObservations((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
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

      {isCctvLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-1000">
          <Badge
            variant="secondary"
            className="px-4 py-2 animate-pulse bg-white/90 shadow-md border-primary text-primary"
          >
            CCTV 데이터를 가져오는 중...
          </Badge>
        </div>
      )}

      <KakaoMap
        center={mapCenter}
        style={{ width: "100%", height: "100%" }}
        level={7}
        onClick={handleMapClick}
        onIdle={handleIdle}
      >
        {observations.map((obs, idx) => (
          <ObservationMarker
            key={obs.id}
            index={idx}
            onCenterChange={setMapCenter}
          />
        ))}

        <RoutePolyline />
        <IsochronePolygon />
        <CCTVMarkers onCenterChange={setMapCenter} />
      </KakaoMap>
    </>
  );
}
