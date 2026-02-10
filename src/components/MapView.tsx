"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useState } from "react";
import {
  Map as KMap,
  MapMarker,
  Polygon,
  Polyline,
  useMap,
} from "react-kakao-maps-sdk";
import { Badge } from "@/components/ui/badge";
import {
  activeTabAtom,
  analysisResultAtom,
  isochroneDataAtom,
  observationsAtom,
} from "@/store/atoms";
import type { Observation } from "@/types/analyze";

export function MapView() {
  const [observations, setObservations] = useAtom(observationsAtom);
  const analysisResult = useAtomValue(analysisResultAtom);
  const isochroneData = useAtomValue(isochroneDataAtom);
  const setActiveTab = useSetAtom(activeTabAtom);
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.978 });

  // 지도 클릭 → 새 발견 지점 추가
  const handleMapClick = useCallback(
    (_: any, mouseEvent: any) => {
      if (observations.length >= 7) return;

      const latlng = mouseEvent.latLng;
      const newObs: Observation = {
        lat: latlng.getLat(),
        lng: latlng.getLng(),
        timestamp: new Date().toISOString(),
      };

      setObservations((prev) => [...prev, newObs]);
    },
    [observations.length, setObservations],
  );

  // 마커 색상 (순서별)
  const markerColors = [
    "#E24A4A",
    "#4A90E2",
    "#50C878",
    "#FFB347",
    "#9B59B6",
    "#1ABC9C",
    "#E67E22",
  ];

  return (
    <div className="absolute inset-0">
      <KMap
        center={center}
        style={{ width: "100%", height: "100%" }}
        level={5}
        onClick={handleMapClick}
      >
        {/* 발견 지점 마커 (번호 표시) */}
        {observations.map((obs, i) => (
          <MapMarker
            key={i.toString()}
            position={{ lat: obs.lat, lng: obs.lng }}
            image={{
              src: `https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png`,
              size: { width: 24, height: 35 },
            }}
            title={`지점 ${i + 1}`}
            clickable
          />
        ))}

        {/* 경로 폴리라인 */}
        {analysisResult?.segments?.map((segment, i) =>
          segment.routes?.map((route, j) => (
            <Polyline
              key={`route-${i}-${j.toString()}`}
              path={route.polyline.map(([lng, lat]) => ({
                lat,
                lng,
              }))}
              strokeWeight={5}
              strokeColor={route.mode === "walking" ? "#4A90E2" : "#E24A4A"}
              strokeOpacity={0.8}
              strokeStyle="solid"
            />
          )),
        )}

        {/* Isochrone 폴리곤 */}
        {isochroneData?.features?.map((feature: any, i: number) => {
          const coords = feature.geometry.coordinates[0];
          return (
            <Polygon
              key={`iso-${i.toString()}`}
              path={coords.map(([lng, lat]: number[]) => ({
                lat,
                lng,
              }))}
              strokeWeight={2}
              strokeColor="#FF6B6B"
              strokeOpacity={0.8}
              strokeStyle="dashed"
              fillColor="#FF6B6B"
              fillOpacity={0.15}
            />
          );
        })}
      </KMap>

      {/* 지도 위 오버레이: 지점 추가 안내 */}
      {observations.length < 2 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <Badge variant="secondary" className="shadow-lg text-sm px-4 py-2">
            지도를 탭하여 발견 지점 추가 ({observations.length}/7)
          </Badge>
        </div>
      )}

      {/* 지도 위 오버레이: 지점 수 표시 */}
      {observations.length >= 2 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <Badge variant="default" className="shadow-lg text-sm px-4 py-2">
            {observations.length}개 지점 등록됨
          </Badge>
        </div>
      )}
    </div>
  );
}
