// src/features/map-view/ui/MapView.tsx
"use client";

import {
  allCctvAtom,
  cctvLoadingAtom,
} from "@/features/cctv-mapping/model/atoms";
import { observationsAtom } from "@/features/observation-input/model/atoms";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { useAtomValue, useSetAtom } from "jotai";
import { Check, Layers } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Map as KakaoMap, MapTypeId } from "react-kakao-maps-sdk";
import { useKakaoMapSdk } from "../lib/useKakaoMapSdk";
import { useMapInteraction } from "../lib/useMapInteraction";
import { useMapLayers } from "../lib/useMapLayers";
import { useMapViewport } from "../lib/useMapViewport";
import { allCctvForPurposeAtom, mapCenterCommandAtom } from "../model/atoms";
import { CCTVMarkers } from "./CCTVMarker";
import { HotspotMarkers } from "./HotspotMarkers";
import { IsochronePolygon } from "./IsoChronePolygon";
import { ObservationMarker } from "./ObservationMarker";
import { RoutePolyline } from "./RoutePolyLine";
import { SelectionOverlay } from "./SelectionOverlay";
import { TransitMarkers } from "./TransitMarkers";

export function MapView() {
  const observations = useAtomValue(observationsAtom);
  const isCctvLoading = useAtomValue(cctvLoadingAtom);
  const mapRef = useRef<kakao.maps.Map>(null);

  // allCctvAtom → allCctvForPurposeAtom 동기화 (순환 의존 방지)
  const allCctv = useAtomValue(allCctvAtom);
  const setAllCctvForPurpose = useSetAtom(allCctvForPurposeAtom);
  useEffect(() => {
    setAllCctvForPurpose(allCctv);
  }, [allCctv, setAllCctvForPurpose]);

  const { isLoaded } = useKakaoMapSdk(mapRef);
  const { mapCenter, mapLevel, setMapLevel, panToWithOffset, handleIdle } =
    useMapViewport(mapRef);

  // 외부 PanTo 명령 구독
  const mapCenterCommand = useAtomValue(mapCenterCommandAtom);
  useEffect(() => {
    if (mapCenterCommand) {
      panToWithOffset(
        mapCenterCommand.lat,
        mapCenterCommand.lng,
        0,
        mapCenterCommand.yOffset,
      );
    }
  }, [mapCenterCommand, panToWithOffset]);

  const {
    mapLayers,
    isLayerMenuOpen,
    toggleLayer,
    toggleLayerMenu,
    closeLayerMenu,
  } = useMapLayers();

  const { handleMapClick } = useMapInteraction(panToWithOffset);

  // 교통 정보 레이어 강제 갱신용
  const [trafficRefreshToggle, setTrafficRefreshToggle] = useState(true);

  useEffect(() => {
    // 5분마다 교통정보 갱신 (5 * 60 * 1000 = 300000ms)
    if (!mapLayers.traffic) return; // 켜져있을 때만 갱신

    const timer = setInterval(() => {
      setTrafficRefreshToggle(false);
      setTimeout(() => {
        setTrafficRefreshToggle(true);
      }, 100);
    }, 300000);

    return () => clearInterval(timer);
  }, [mapLayers.traffic]);

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
      {/* Top-Left Controls: Traffic & CCTV Toggle */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <Button
          variant={mapLayers.traffic ? "default" : "secondary"}
          size="sm"
          className={cn(
            "shadow-md h-9 px-3 gap-1.5 font-bold transition-all",
            mapLayers.traffic
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-white/90 text-emerald-700 hover:bg-gray-50",
          )}
          onClick={() => toggleLayer("traffic")}
        >
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              mapLayers.traffic ? "bg-white animate-pulse" : "bg-emerald-500",
            )}
          />
          교통정보
        </Button>
        <Button
          variant={mapLayers.cctv ? "default" : "secondary"}
          size="sm"
          className={cn(
            "shadow-md h-9 px-3 gap-1.5 font-bold transition-all",
            mapLayers.cctv
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-white/90 text-green-700 hover:bg-gray-50",
          )}
          onClick={() => toggleLayer("cctv")}
        >
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              mapLayers.cctv ? "bg-white animate-pulse" : "bg-green-500",
            )}
          />
          CCTV
        </Button>
        <Button
          variant={mapLayers.hotspot ? "default" : "secondary"}
          size="sm"
          className={cn(
            "shadow-md h-9 px-3 gap-1.5 font-bold transition-all",
            mapLayers.hotspot
              ? "bg-orange-600 hover:bg-orange-700 text-white"
              : "bg-white/90 text-orange-700 hover:bg-gray-50",
          )}
          onClick={() => toggleLayer("hotspot")}
        >
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              mapLayers.hotspot ? "bg-white animate-pulse" : "bg-orange-500",
            )}
          />
          중복 경로
        </Button>
      </div>

      {/* Floating Controls (Top-Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
        <div className="flex items-center gap-2">
          <SelectionOverlay />
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "shadow-md transition-colors",
              isLayerMenuOpen
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-white/90",
            )}
            aria-label="지도 레이어 설정"
            aria-expanded={isLayerMenuOpen}
            onClick={toggleLayerMenu}
          >
            <Layers className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>

        {isLayerMenuOpen && (
          <div className="bg-white rounded-lg shadow-xl border p-2 flex flex-col gap-1 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-200">
            {[
              {
                id: "observations" as const,
                label: "관측 지점",
                color: "text-red-500",
              },
              {
                id: "route" as const,
                label: "이동 경로",
                color: "text-blue-500",
              },
              {
                id: "isochrone" as const,
                label: "도달 범위",
                color: "text-purple-500",
              },
              {
                id: "transit" as const,
                label: "대중교통 현황",
                color: "text-orange-500",
              },
            ].map((layer) => (
              <div key={layer.id}>
                <button
                  type="button"
                  className="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors w-full text-left"
                  onClick={() => {
                    toggleLayer(layer.id);
                  }}
                >
                  <span className={`flex items-center gap-1.5 ${layer.color}`}>
                    {layer.label}
                  </span>
                  {mapLayers[layer.id] && (
                    <Check className="w-3 h-3 text-blue-600" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isCctvLoading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[50] pointer-events-none">
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
        onClick={(map, e) => {
          if (isLayerMenuOpen) {
            closeLayerMenu();
            return;
          }
          handleMapClick(map, e);
        }}
        onIdle={handleIdle}
        onCreate={(map) => {
          setTimeout(() => map.relayout(), 50);
        }}
      >
        {mapLayers.traffic && trafficRefreshToggle && (
          <MapTypeId type="TRAFFIC" />
        )}
        {mapLayers.observations &&
          observations.map((obs, idx) => (
            <ObservationMarker
              key={obs.id}
              index={idx}
              onCenterChange={(latlng) =>
                panToWithOffset(latlng.lat, latlng.lng)
              }
            />
          ))}
        {mapLayers.route && <RoutePolyline />}
        {mapLayers.hotspot && <HotspotMarkers />}
        {mapLayers.isochrone && <IsochronePolygon />}
        {mapLayers.cctv && (
          <CCTVMarkers
            onCenterChange={(latlng) => panToWithOffset(latlng.lat, latlng.lng)}
          />
        )}
        {mapLayers.transit && (
          <TransitMarkers
            onCenterChange={(latlng) => panToWithOffset(latlng.lat, latlng.lng)}
          />
        )}
      </KakaoMap>
    </div>
  );
}
