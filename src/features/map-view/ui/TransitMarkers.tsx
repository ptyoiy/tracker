// src/features/map-view/ui/TransitMarkers.tsx
"use client";

import { observationsAtom } from "@/features/observation-input/model/atoms";
import { transitResultAtom } from "@/features/transit-lookup/model/atoms";
import { BusStationCard } from "@/features/transit-lookup/ui/BusStationCard";
import { SubwayStationCard } from "@/features/transit-lookup/ui/SubwayStationCard";
import { useAtom, useAtomValue } from "jotai";
import { X } from "lucide-react";
import { useMemo } from "react";
import { CustomOverlayMap } from "react-kakao-maps-sdk";
import { activePopupAtom } from "../model/atoms";

export function TransitMarkers({
  onCenterChange,
}: {
  onCenterChange?: (latlng: { lat: number; lng: number }) => void;
}) {
  const result = useAtomValue(transitResultAtom);
  const observations = useAtomValue(observationsAtom);
  const [activePopup, setActivePopup] = useAtom(activePopupAtom);

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

  if (!result) return null;

  // 현재 열려있는 팝업 정보
  const activeBusStation =
    activePopup?.type === "transit-bus"
      ? result.bus.stations.find((s) => s.stationId === activePopup.stationId)
      : null;
  const activeSubwayStation =
    activePopup?.type === "transit-subway"
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

  return (
    <>
      {result.bus.stations.map((station) => (
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
            <div className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap mb-0.5">
              {station.stationName}
            </div>
            <div className="w-5 h-5 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center shadow-md relative z-10">
              <span className="text-[10px]">🚌</span>
            </div>
          </button>
        </CustomOverlayMap>
      ))}

      {result.subway.stations.map((station) => (
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

      {/* 팝업 오버레이 */}
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
    </>
  );
}
