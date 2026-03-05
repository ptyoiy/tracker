// src/features/map-view/ui/MapView.tsx
"use client";

import {
  allCctvAtom,
  cctvLoadingAtom,
} from "@/features/cctv-mapping/model/atoms";
import { observationsAtom } from "@/features/observation-input/model/atoms";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { useAtomValue, useSetAtom } from "jotai";
import { Check, Crosshair, Layers } from "lucide-react";
import { useEffect, useRef } from "react";
import { Map as KakaoMap } from "react-kakao-maps-sdk";
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
  const {
    mapCenter,
    mapLevel,
    setMapLevel,
    panToWithOffset,
    handleIdle,
    recenter,
  } = useMapViewport(mapRef);

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

  // [MODIFY] 3. CCTV 목적별 필터 UI 숨김에 따른 미사용 변수 처리
  // const [isCctvSubMenuOpen, setIsCctvSubMenuOpen] = useState(false);

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

  // [MODIFY] 3. CCTV 목적별 필터 UI 숨김에 따른 미사용 변수 처리
  // const allPurposesHidden =
  //  cctvPurposeFilter.size > 0 && cctvPurposeFilter.size >= cctvPurposes.length;

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

        <SelectionOverlay />

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
                id: "cctv" as const,
                label: "CCTV 마커",
                color: "text-green-600",
              },
              {
                id: "transit" as const,
                label: "대중교통 현황",
                color: "text-orange-500",
              },
              {
                id: "hotspot" as const,
                label: "중복 경로",
                color: "text-orange-600",
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
                    {layer.id === "cctv" ? "CCTV" : layer.label}
                    {/* [MODIFY] 3. CCTV 하위 메뉴 버튼 제거
                    {layer.id === "cctv" && cctvPurposes.length > 0 && (
                      <button
                        type="button"
                        className="p-0.5 rounded hover:bg-gray-200 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCctvSubMenuOpen((prev) => !prev);
                        }}
                        aria-label="CCTV 목적별 필터 펼치기"
                      >
                        <ChevronDown
                          className={`w-3 h-3 transition-transform duration-200 ${isCctvSubMenuOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                    */}
                  </span>
                  {mapLayers[layer.id] && (
                    <Check className="w-3 h-3 text-blue-600" />
                  )}
                </button>

                {/* [MODIFY] 3. CCTV 목적별 필터 UI 숨김
                {layer.id === "cctv" &&
                  isCctvSubMenuOpen &&
                  cctvPurposes.length > 0 && (
                    <div className="ml-3 pl-2 border-l-2 border-green-200 mb-1 flex flex-col gap-0.5">
                      <button
                        type="button"
                        className="flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold rounded hover:bg-gray-50 transition-colors w-full text-left text-gray-500"
                        onClick={() => toggleAllCctvPurposes()}
                      >
                        <span>
                          {allPurposesHidden ? "전체 표시" : "전체 숨기기"}
                        </span>
                        {!allPurposesHidden && (
                          <Check className="w-2.5 h-2.5 text-blue-600" />
                        )}
                      </button>

                      <div className="h-px bg-gray-100 my-0.5" />

                      {cctvPurposes.map((purpose) => {
                        const isHidden = cctvPurposeFilter.has(purpose);
                        return (
                          <button
                            key={purpose}
                            type="button"
                            className="flex items-center justify-between px-2 py-1 text-[11px] rounded hover:bg-gray-50 transition-colors w-full text-left"
                            onClick={() => toggleCctvPurpose(purpose)}
                          >
                            <span
                              className={
                                isHidden
                                  ? "text-gray-400 line-through"
                                  : "text-green-700"
                              }
                            >
                              {purpose}
                            </span>
                            {!isHidden && (
                              <Check className="w-2.5 h-2.5 text-green-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                */}
              </div>
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
        {mapLayers.hotspot && <HotspotMarkers />}{" "}
        {/* 핫스팟도 라우트 레이어에 포함 */}
        {mapLayers.isochrone && <IsochronePolygon />}
        {mapLayers.cctv && (
          <CCTVMarkers
            onCenterChange={(latlng) => panToWithOffset(latlng.lat, latlng.lng)}
            // purposeFilter={cctvPurposeFilter} // [MODIFY] 3. 목적 필터 미사용
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
