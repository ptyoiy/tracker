// src/features/map-view/ui/MapView.tsx
"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Check, Crosshair, Layers } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Map as KakaoMap } from "react-kakao-maps-sdk";
import { useLoadCctvOnce } from "@/features/cctv-mapping/lib/cctv-api";
import { useComputeRouteCctvCount } from "@/features/cctv-mapping/lib/route-cctv-count";
import { useCctvSearch } from "@/features/cctv-mapping/lib/useCctvSearch";
import { cctvLoadingAtom } from "@/features/cctv-mapping/model/atoms";
import { observationsAtom } from "@/features/observation-input/model/atoms";
import {
  transitLookupEndAtom,
  transitLookupPickingAtom,
  transitLookupStartAtom,
} from "@/features/transit-lookup/model/atoms";
import { coordToAddress } from "@/shared/api/kakao/geocoder";
import { DEFAULT_CENTER } from "@/shared/config/constant";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { activeSectionAtom } from "@/store/atoms";
import { activePopupAtom, mapLayersAtom, viewportAtom } from "../model/atoms";
import { CCTVMarkers } from "./CCTVMarker";
import { IsochronePolygon } from "./IsoChronePolygon";
import { ObservationMarker } from "./ObservationMarker";
import { RoutePolyline } from "./RoutePolyLine";

export function MapView() {
  const activeSection = useAtomValue(activeSectionAtom);
  const observations = useAtomValue(observationsAtom);
  const isCctvLoading = useAtomValue(cctvLoadingAtom);
  const setObservations = useSetAtom(observationsAtom);
  const setViewport = useSetAtom(viewportAtom);
  const [activePopup, setActivePopup] = useAtom(activePopupAtom);
  const [mapLayers, setMapLayers] = useAtom(mapLayersAtom);
  const { searchNearby } = useCctvSearch();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const mapRef = useRef<kakao.maps.Map>(null);

  // SDK 로드 확인 루프
  useEffect(() => {
    const checkSdk = setInterval(() => {
      if (typeof window !== "undefined" && window.kakao && window.kakao.maps) {
        setIsLoaded(true);
        clearInterval(checkSdk);
      }
    }, 200);
    return () => clearInterval(checkSdk);
  }, []);

  // 대중교통 조회 관련 상태
  const [picking, setPicking] = useAtom(transitLookupPickingAtom);
  const setTransitStart = useSetAtom(transitLookupStartAtom);
  const setTransitEnd = useSetAtom(transitLookupEndAtom);

  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapLevel, setMapLevel] = useState(7);

  useLoadCctvOnce();
  useComputeRouteCctvCount();

  // 관측 지점이 추가될 때만 지도를 마지막 지점으로 이동
  useEffect(() => {
    const last = observations[observations.length - 1];
    if (last) {
      setMapCenter({ lat: last.lat, lng: last.lng });
    }
  }, [observations]);

  // SDK 로드 직후 또는 크기 변경 시 relayout 강제 호출
  useEffect(() => {
    if (isLoaded && mapRef.current) {
      mapRef.current.relayout();
    }
  }, [isLoaded]);

  const handleMapClick = async (
    _t: kakao.maps.Map,
    mouseEvent: kakao.maps.event.MouseEvent,
  ) => {
    if (activePopup) {
      setActivePopup(null);
      return;
    }

    if (isLayerMenuOpen) {
      setIsLayerMenuOpen(false);
      return;
    }

    const latlng = mouseEvent.latLng;
    const lat = latlng.getLat();
    const lng = latlng.getLng();

    if (picking) {
      if (picking === "start") setTransitStart({ lat, lng });
      else setTransitEnd({ lat, lng });
      setPicking(null);
      return;
    }

    if (activeSection === "cctv") {
      searchNearby(lat, lng);
      return;
    }

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

  const recenter = () => {
    const last = observations[observations.length - 1];
    if (last) {
      setMapCenter({ lat: last.lat, lng: last.lng });
    } else {
      setMapCenter(DEFAULT_CENTER);
    }
    setMapLevel(7);
  };

  const toggleLayer = (layer: keyof typeof mapLayers) => {
    setMapLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  if (!isLoaded) {
    return (
      <div
        className="w-full h-full bg-gray-50 flex items-center justify-center text-xs text-gray-400"
        role="alert"
        aria-busy="true"
      >
        지도 데이터를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="w-full h-full relative min-h-[500px]">
      {/* Floating Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
        <Button
          variant="secondary"
          size="icon"
          className={`shadow-md transition-colors ${isLayerMenuOpen ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white/90"}`}
          aria-label="지도 레이어 설정"
          aria-expanded={isLayerMenuOpen}
          onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
        >
          <Layers className="w-5 h-5" aria-hidden="true" />
        </Button>

        {isLayerMenuOpen && (
          <div className="bg-white rounded-lg shadow-xl border p-2 flex flex-col gap-1 min-w-[140px] animate-in fade-in slide-in-from-top-2 duration-200">
            {[
              { id: "observations", label: "관측 지점", color: "text-red-500" },
              { id: "route", label: "이동 경로", color: "text-blue-500" },
              { id: "isochrone", label: "도달 범위", color: "text-purple-500" },
              { id: "cctv", label: "CCTV 마커", color: "text-green-600" },
            ].map((layer) => (
              <button
                key={layer.id}
                type="button"
                className="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors w-full text-left"
                onClick={() => toggleLayer(layer.id as any)}
              >
                <span className={layer.color}>{layer.label}</span>
                {mapLayers[layer.id as keyof typeof mapLayers] && (
                  <Check className="w-3 h-3 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-32 right-4 z-20 flex flex-col gap-2">
        <Button
          variant="default"
          size="icon"
          className="shadow-lg rounded-full h-12 w-12 bg-white text-gray-900 hover:bg-gray-100 border border-gray-200"
          aria-label="지도를 마지막 관측 지점으로 재중심"
          onClick={recenter}
        >
          <Crosshair className="w-6 h-6" aria-hidden="true" />
        </Button>
      </div>

      {isCctvLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[50] pointer-events-none">
          <Badge
            variant="secondary"
            className="px-4 py-2 bg-white/90 shadow-md border-primary text-primary"
          >
            CCTV 데이터를 가져오는 중...
          </Badge>
        </div>
      )}

      <KakaoMap
        id="main-map"
        ref={mapRef}
        center={mapCenter}
        style={{ width: "100%", height: "100%" }}
        level={mapLevel}
        onZoomChanged={(map) => setMapLevel(map.getLevel())}
        onClick={handleMapClick}
        onIdle={handleIdle}
        onCreate={(map) => {
          setTimeout(() => map.relayout(), 50);
        }}
      >
        {mapLayers.observations &&
          observations.map((obs, idx) => (
            <ObservationMarker
              key={obs.id}
              index={idx}
              onCenterChange={setMapCenter}
            />
          ))}

        {mapLayers.route && <RoutePolyline />}
        {mapLayers.isochrone && <IsochronePolygon />}
        {mapLayers.cctv && <CCTVMarkers onCenterChange={setMapCenter} />}
      </KakaoMap>
    </div>
  );
}
