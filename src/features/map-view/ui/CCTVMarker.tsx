// src/features/map-view/ui/CCTVMarker.tsx
"use client";

import { useAtomValue } from "jotai";
import { CustomOverlayMap, MapMarker } from "react-kakao-maps-sdk";
import { filteredCctvAtom } from "@/features/cctv-mapping/model/atoms";

export function CCTVMarkers() {
  const cctvs = useAtomValue(filteredCctvAtom);

  if (!cctvs.length) return null;

  return (
    <>
      {cctvs.map((c) => (
        <MapMarker
          key={c.id}
          position={{ lat: c.lat, lng: c.lng }}
          image={{
            src: "/icons/cctv.png",
            size: { width: 18, height: 18 },
          }}
        >
          <CustomOverlayMap position={{ lat: c.lat, lng: c.lng }}>
            <div className="rounded bg-black/70 px-1 py-0.5 text-[10px] text-white">
              {c.roadName ?? "CCTV"}{" "}
              {c.direction !== "UNKNOWN" ? `(${c.direction})` : ""}
            </div>
          </CustomOverlayMap>
        </MapMarker>
      ))}
    </>
  );
}
