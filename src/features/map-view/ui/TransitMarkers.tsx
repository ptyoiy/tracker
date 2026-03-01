// src/features/map-view/ui/TransitMarkers.tsx
"use client";

import { transitResultAtom } from "@/features/transit-lookup/model/atoms";
import { useAtomValue } from "jotai";
import { CustomOverlayMap } from "react-kakao-maps-sdk";

export function TransitMarkers({
  onCenterChange,
}: {
  onCenterChange?: (latlng: { lat: number; lng: number }) => void;
}) {
  const result = useAtomValue(transitResultAtom);

  if (!result) return null;

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
    </>
  );
}
