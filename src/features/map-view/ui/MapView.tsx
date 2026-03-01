// src/features/map-view/ui/MapView.tsx
"use client";

import { cctvLoadingAtom } from "@/features/cctv-mapping/model/atoms";
import { observationsAtom } from "@/features/observation-input/model/atoms";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { useAtomValue } from "jotai";
import { Check, Crosshair, Layers } from "lucide-react";
import { useRef } from "react";
import { Map as KakaoMap } from "react-kakao-maps-sdk";
import { useKakaoMapSdk } from "../lib/useKakaoMapSdk";
import { useMapInteraction } from "../lib/useMapInteraction";
import { useMapLayers } from "../lib/useMapLayers";
import { useMapViewport } from "../lib/useMapViewport";
import { CCTVMarkers } from "./CCTVMarker";
import { IsochronePolygon } from "./IsoChronePolygon";
import { ObservationMarker } from "./ObservationMarker";
import { RoutePolyline } from "./RoutePolyLine";
import { TransitMarkers } from "./TransitMarkers";

export function MapView() {
  const observations = useAtomValue(observationsAtom);
  const isCctvLoading = useAtomValue(cctvLoadingAtom);
  const mapRef = useRef<kakao.maps.Map>(null);

  const { isLoaded } = useKakaoMapSdk(mapRef);
  const {
    mapCenter,
    mapLevel,
    setMapLevel,
    panToWithOffset,
    handleIdle,
    recenter,
  } = useMapViewport(mapRef);

  const {
    mapLayers,
    isLayerMenuOpen,
    toggleLayer,
    toggleLayerMenu,
    closeLayerMenu,
  } = useMapLayers();

  const { handleMapClick } = useMapInteraction(panToWithOffset);

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
          onClick={toggleLayerMenu}
        >
          <Layers className="w-5 h-5" aria-hidden="true" />
        </Button>

        {isLayerMenuOpen && (
          <div className="bg-white rounded-lg shadow-xl border p-2 flex flex-col gap-1 min-w-[140px] animate-in fade-in slide-in-from-top-2 duration-200">
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
                id: "cctv" as const,
                label: "CCTV 마커",
                color: "text-green-600",
              },
              {
                id: "transit" as const,
                label: "대중교통 현황",
                color: "text-orange-500",
              },
            ].map((layer) => (
              <button
                key={layer.id}
                type="button"
                className="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors w-full text-left"
                onClick={() => {
                  toggleLayer(layer.id);
                }}
              >
                <span className={layer.color}>{layer.label}</span>
                {mapLayers[layer.id] && (
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
