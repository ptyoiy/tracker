// src/features/map-view/ui/CCTVMarker.tsx
"use client";

import { useAtomValue } from "jotai";
import { CustomOverlayMap, MapMarker } from "react-kakao-maps-sdk";
import {
  filteredCctvAtom,
  hoveredCctvIdAtom,
} from "@/features/cctv-mapping/model/atoms";

export function CCTVMarkers() {
  const cctvs = useAtomValue(filteredCctvAtom);
  const hoveredId = useAtomValue(hoveredCctvIdAtom);
  console.log({ cctvs });
  if (!cctvs.length) return null;

  return (
    <>
      {cctvs.map((c) => {
        const isActive = c.id === hoveredId;

        return (
          <MapMarker
            key={c.id}
            position={{ lat: c.lat, lng: c.lng }}
            image={{
              src: isActive ? "/icons/cctv-active.png" : "/icons/cctv.png",
              size: { width: isActive ? 22 : 18, height: isActive ? 22 : 18 },
            }}
          >
            {isActive && (
              <CustomOverlayMap position={{ lat: c.lat, lng: c.lng }}>
                <div className="rounded bg-black/70 px-1 py-0.5 text-[10px] text-white">
                  {c.roadName ?? "CCTV"} ({c.direction})
                </div>
              </CustomOverlayMap>
            )}
          </MapMarker>
        );
      })}
    </>
  );
}
