// src/features/map-view/ui/TransitMarkers.tsx
"use client";

import { observationsAtom } from "@/features/observation-input/model/atoms";
import {
  nearbyStationsAtom,
  selectedRoutePathAtom,
  transitResultAtom,
} from "@/features/transit-lookup/model/atoms";
import { BusStationCard } from "@/features/transit-lookup/ui/BusStationCard";
import { SubwayStationCard } from "@/features/transit-lookup/ui/SubwayStationCard";
import { useAtom, useAtomValue } from "jotai";
import { MapPinOff, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CustomOverlayMap, Polyline } from "react-kakao-maps-sdk";
import { activePopupAtom } from "../model/atoms";

export function TransitMarkers({
  onCenterChange,
}: {
  onCenterChange?: (latlng: { lat: number; lng: number }) => void;
}) {
  const result = useAtomValue(transitResultAtom);
  const nearbyStations = useAtomValue(nearbyStationsAtom);
  const [selectedRoutePath, setSelectedRoutePath] = useAtom(
    selectedRoutePathAtom,
  );
  const observations = useAtomValue(observationsAtom);
  const [activePopup, setActivePopup] = useAtom(activePopupAtom);

  // 디버그 로그
  const busNearby = nearbyStations.filter((s) => s.type === "bus");
  const subwayNearby = nearbyStations.filter((s) => s.type === "subway");
  console.log(
    "[DEBUG:TransitMarkers] nearbyStations:",
    nearbyStations.length,
    "개",
    busNearby.length,
    "버스",
    subwayNearby.length,
    "지하철",
  );
  if (busNearby.length > 0)
    console.log(
      busNearby,
      "[DEBUG:TransitMarkers] 버스 좌표 샘플:",
      busNearby.slice(0, 3).map((s) => ({
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        stationId: s.stationId,
      })),
    );
  if (subwayNearby.length > 0)
    console.log(
      "[DEBUG:TransitMarkers] 지하철 좌표 샘플:",
      subwayNearby.slice(0, 2).map((s) => ({
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        stationId: s.stationId,
      })),
    );
  console.log(
    "[DEBUG:TransitMarkers] transitResult bus:",
    result?.bus.stations.length ?? 0,
    "subway:",
    result?.subway.stations.length ?? 0,
  );

  // 가장 가까운 관측 지점의 시각
  const nearestRefTime = useMemo(() => {
    if (!observations.length) return null;
    const sorted = [...observations]
      .filter((o) => o.timestamp)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    return sorted[0]?.timestamp ?? null;
  }, [observations]);

  // 현재 상세 조회(transitResult)에 포함된 정류장 ID Set (중복 방지)
  const resultStationIds = useMemo(() => {
    const ids = new Set<string>();
    if (result) {
      for (const s of result.bus.stations) ids.add(`bus-${s.stationId}`);
      for (const s of result.subway.stations)
        ids.add(`subway-${s.stationCode}`);
    }
    return ids;
  }, [result]);

  // nearbyStations 중 상세 조회 결과와 겹치지 않는 것만 표시
  const filteredNearbyStations = useMemo(
    () =>
      nearbyStations.filter(
        (ns) => !resultStationIds.has(`${ns.type}-${ns.stationId}`),
      ),
    [nearbyStations, resultStationIds],
  );
  console.log(
    "[DEBUG:TransitMarkers] filteredNearby:",
    filteredNearbyStations.length,
    "개 (bus:",
    filteredNearbyStations.filter((s) => s.type === "bus").length,
    "subway:",
    filteredNearbyStations.filter((s) => s.type === "subway").length,
    ")",
  );
  // 현재 열려있는 팝업 정보 (상세 결과 + nearby 폴백)
  const activeBusStation = (() => {
    if (activePopup?.type !== "transit-bus") return null;
    // 1) 상세 조회 결과에서 찾기
    if (result) {
      const found = result.bus.stations.find(
        (s) => s.stationId === activePopup.stationId,
      );
      if (found) return found;
    }
    // 2) nearby에서 폴백 (최소 정보로 팝업 표시)
    const nearbyMatch = nearbyStations.find(
      (s) => s.type === "bus" && s.stationId === activePopup.stationId,
    );
    if (nearbyMatch) {
      return {
        stationId: nearbyMatch.stationId,
        arsId: nearbyMatch.stationId,
        stationName: nearbyMatch.name,
        lat: nearbyMatch.lat,
        lng: nearbyMatch.lng,
        distance: nearbyMatch.distance ?? 0,
        routes: [],
      };
    }
    return null;
  })();

  const activeSubwayStation =
    activePopup?.type === "transit-subway" && result
      ? result.subway.stations.find(
          (s) => s.stationCode === activePopup.stationCode,
        )
      : null;

  const popupStation = activeBusStation || activeSubwayStation;
  const popupType = activeBusStation
    ? ("bus" as const)
    : activeSubwayStation
      ? ("subway" as const)
      : null;

  // 경로 정류소 팝업 state
  const [activeStopIdx, setActiveStopIdx] = useState<number | null>(null);

  // 경로 표시 중이면 다른 마커 숨김
  const hideOtherMarkers = !!selectedRoutePath;

  return (
    <>
      {/* 관측지점 기반 인근 버스 정류장 마커 (경로 표시 중 아닐 때만) */}
      {!hideOtherMarkers &&
        filteredNearbyStations
          .filter((ns) => ns.type === "bus")
          .map((station) => (
            <CustomOverlayMap
              key={`nearby-bus-${station.stationId}`}
              position={{ lat: station.lat, lng: station.lng }}
              yAnchor={1}
              zIndex={8}
              clickable
            >
              <button
                type="button"
                className="flex flex-col items-center group -mt-1 hover:scale-110 transition-transform opacity-75 hover:opacity-100"
                onClick={() => {
                  onCenterChange?.({ lat: station.lat, lng: station.lng });
                  setActivePopup({
                    type: "transit-bus",
                    stationId: station.stationId,
                  });
                }}
              >
                {/* [MODIFY] 3. 버스 정류장 마커에서 이름 숨김
                <div className="bg-blue-400 text-white text-[9px] font-medium px-1 py-0.5 rounded shadow-sm whitespace-nowrap mb-0.5">
                  {station.name}
                </div>
                */}
                <div className="w-4 h-4 bg-white border-2 border-blue-400 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-[8px]">🚌</span>
                </div>
              </button>
            </CustomOverlayMap>
          ))}

      {/* 관측지점 기반 인근 지하철역 마커 (경로 표시 중 아닐 때만) */}
      {!hideOtherMarkers &&
        filteredNearbyStations
          .filter((ns) => ns.type === "subway")
          .map((station) => (
            <CustomOverlayMap
              key={`nearby-subway-${station.stationId}`}
              position={{ lat: station.lat, lng: station.lng }}
              yAnchor={1}
              zIndex={9}
              clickable
            >
              <button
                type="button"
                className="flex flex-col items-center group -mt-1 hover:scale-110 transition-transform opacity-75 hover:opacity-100"
                onClick={() => {
                  onCenterChange?.({ lat: station.lat, lng: station.lng });
                }}
              >
                <div className="bg-orange-400 text-white text-[9px] font-medium px-1 py-0.5 rounded shadow-sm whitespace-nowrap mb-0.5">
                  {station.name}역
                </div>
                <div className="w-4 h-4 bg-white border-2 border-orange-400 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-[8px]">🚇</span>
                </div>
              </button>
            </CustomOverlayMap>
          ))}

      {/* 상세 조회된 버스 정류장 마커 (경로 표시 중 아닐 때만) */}
      {!hideOtherMarkers &&
        result?.bus.stations.map((station) => (
          <CustomOverlayMap
            key={`bus-${station.stationId}`}
            position={{ lat: station.lat, lng: station.lng }}
            yAnchor={1}
            zIndex={10}
            clickable
          >
            <button
              type="button"
              className="flex flex-col items-center group -mt-1 hover:scale-110 transition-transform"
              onClick={() => {
                onCenterChange?.({ lat: station.lat, lng: station.lng });
                setActivePopup({
                  type: "transit-bus",
                  stationId: station.stationId,
                });
              }}
            >
              {/* [MODIFY] 3. 버스 정류장 마커에서 이름 숨김
              <div className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap mb-0.5">
                {station.stationName}
              </div>
              */}
              <div className="w-5 h-5 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center shadow-md relative z-10">
                <span className="text-[10px]">🚌</span>
              </div>
            </button>
          </CustomOverlayMap>
        ))}

      {/* 상세 조회된 지하철역 마커 (경로 표시 중 아닐 때만) */}
      {!hideOtherMarkers &&
        result?.subway.stations.map((station) => (
          <CustomOverlayMap
            key={`subway-${station.stationCode}`}
            position={{ lat: station.lat, lng: station.lng }}
            yAnchor={1}
            zIndex={11}
            clickable
          >
            <button
              type="button"
              className="flex flex-col items-center group -mt-1 hover:scale-110 transition-transform"
              onClick={() => {
                onCenterChange?.({ lat: station.lat, lng: station.lng });
                setActivePopup({
                  type: "transit-subway",
                  stationCode: station.stationCode,
                });
              }}
            >
              <div className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap mb-0.5">
                {station.stationName}역
              </div>
              <div className="w-5 h-5 bg-white border-2 border-orange-500 rounded-full flex items-center justify-center shadow-md relative z-10">
                <span className="text-[10px]">🚇</span>
              </div>
            </button>
          </CustomOverlayMap>
        ))}

      {/* 팝업 오버레이 (마커는 숨겨도 팝업은 유지) */}
      {popupStation && popupType && (
        <CustomOverlayMap
          position={{
            lat: popupStation.lat,
            lng: popupStation.lng,
          }}
          yAnchor={1.1}
          zIndex={100}
          clickable
        >
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-[280px] max-h-[320px] overflow-y-auto custom-scrollbar relative">
            <button
              type="button"
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10"
              onClick={() => setActivePopup(null)}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2 pr-6">
              <span className="text-base">
                {popupType === "bus" ? "🚌" : "🚇"}
              </span>
              <span className="font-bold text-sm text-gray-900 truncate">
                {popupType === "bus"
                  ? (popupStation as typeof activeBusStation)?.stationName
                  : `${(popupStation as typeof activeSubwayStation)?.stationName}역`}
              </span>
              <span className="text-[10px] text-gray-400 shrink-0">
                {popupStation.distance}m
              </span>
            </div>

            {nearestRefTime && (
              <div className="text-[10px] text-gray-400 mb-2">
                기준:{" "}
                {new Date(nearestRefTime).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}

            {popupType === "bus" && activeBusStation ? (
              <BusStationCard station={activeBusStation} />
            ) : activeSubwayStation ? (
              <SubwayStationCard station={activeSubwayStation} />
            ) : null}
          </div>
        </CustomOverlayMap>
      )}
      {/* 선택된 노선 경로 폴리라인 + 경로 해제 버튼 */}
      {selectedRoutePath && selectedRoutePath.path.length >= 2 && (
        <>
          <Polyline
            path={selectedRoutePath.path}
            strokeWeight={5}
            strokeColor={
              selectedRoutePath.type === "bus" ? "#3B82F6" : "#F97316"
            }
            strokeOpacity={0.8}
            strokeStyle="solid"
            zIndex={50}
          />
          {/* 지도 왼쪽 상단에 경로 정보 + 해제 버튼 */}
          <CustomOverlayMap
            position={{
              lat: selectedRoutePath.path[0].lat,
              lng: selectedRoutePath.path[0].lng,
            }}
            yAnchor={2.5}
            xAnchor={0}
            zIndex={200}
            clickable
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 px-3 py-2 flex items-center gap-2">
              <span className="text-sm">
                {selectedRoutePath.type === "bus" ? "🚌" : "🚇"}
              </span>
              <span className="text-xs font-bold text-gray-800">
                {selectedRoutePath.routeName}
              </span>
              <span className="text-[10px] text-gray-500">
                {selectedRoutePath.stops.length}개 정류장
              </span>
              <button
                type="button"
                className="ml-1 px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold rounded border border-red-200 flex items-center gap-0.5 transition-colors"
                onClick={() => {
                  setSelectedRoutePath(null);
                  setActiveStopIdx(null);
                }}
              >
                <MapPinOff className="w-3 h-3" />
                경로 해제
              </button>
            </div>
          </CustomOverlayMap>
        </>
      )}

      {/* 선택된 노선 경유 정류소 마커 (소요시간 표시) */}
      {selectedRoutePath?.stops.map((stop, idx) => (
        <CustomOverlayMap
          key={`route-stop-${idx}-${stop.stationName}`}
          position={{ lat: stop.lat, lng: stop.lng }}
          yAnchor={1}
          zIndex={stop.isFirst ? 55 : activeStopIdx === idx ? 60 : 52}
          clickable
        >
          <button
            type="button"
            className="flex flex-col items-center -mt-0.5 hover:scale-110 transition-transform cursor-pointer"
            onClick={() => setActiveStopIdx(activeStopIdx === idx ? null : idx)}
          >
            <div
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap mb-0.5 ${
                stop.isFirst
                  ? "bg-red-600 text-white ring-2 ring-red-300"
                  : activeStopIdx === idx
                    ? "bg-gray-800 text-white"
                    : stop.isTransfer
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-400"
                      : "bg-white text-gray-700 border border-gray-200"
              }`}
            >
              {stop.isFirst
                ? `📍 기준역 · ${stop.stationName}`
                : `+${stop.cumulativeMinutes}분`}
            </div>
            <div
              className={`rounded-full border-2 shadow-sm ${
                stop.isFirst
                  ? "w-4 h-4 bg-red-500 border-red-600"
                  : stop.isTransfer
                    ? "w-3 h-3 bg-white border-yellow-500"
                    : "w-3 h-3 bg-white border-gray-300"
              }`}
            />
          </button>
        </CustomOverlayMap>
      ))}

      {/* 경유 정류소 팝업 */}
      {activeStopIdx !== null && selectedRoutePath?.stops[activeStopIdx] && (
        <CustomOverlayMap
          position={{
            lat: selectedRoutePath.stops[activeStopIdx].lat,
            lng: selectedRoutePath.stops[activeStopIdx].lng,
          }}
          yAnchor={1.3}
          zIndex={100}
          clickable
        >
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 min-w-[140px] relative">
            <button
              type="button"
              className="absolute top-1.5 right-1.5 text-gray-400 hover:text-gray-600"
              onClick={() => setActiveStopIdx(null)}
            >
              <X className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-1.5 pr-4">
              <span className="text-sm">
                {selectedRoutePath.type === "bus" ? "🚌" : "🚇"}
              </span>
              <span className="font-bold text-xs text-gray-900">
                {selectedRoutePath.stops[activeStopIdx].stationName}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[10px]">
              <span className="text-gray-500">
                {selectedRoutePath.routeName}
              </span>
              <span
                className={`font-bold ${
                  selectedRoutePath.stops[activeStopIdx].isFirst
                    ? "text-blue-600"
                    : selectedRoutePath.stops[activeStopIdx]
                          .cumulativeMinutes <= 10
                      ? "text-green-600"
                      : selectedRoutePath.stops[activeStopIdx]
                            .cumulativeMinutes <= 20
                        ? "text-blue-600"
                        : "text-orange-600"
                }`}
              >
                {selectedRoutePath.stops[activeStopIdx].isFirst
                  ? "승차역"
                  : `+${selectedRoutePath.stops[activeStopIdx].cumulativeMinutes}분`}
              </span>
            </div>
            {selectedRoutePath.stops[activeStopIdx].isTransfer && (
              <div className="text-[9px] text-yellow-700 bg-yellow-50 px-1 py-0.5 rounded mt-1 w-fit">
                🔄 환승 가능
              </div>
            )}
          </div>
        </CustomOverlayMap>
      )}
    </>
  );
}
