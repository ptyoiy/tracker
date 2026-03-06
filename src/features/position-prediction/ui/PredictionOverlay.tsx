"use client";

import { useAtomValue } from "jotai";
import { CustomOverlayMap, Polygon, Polyline } from "react-kakao-maps-sdk";
import {
  futureMinutesAtom,
  predictionResultAtom,
  selectedHypothesisIdAtom,
} from "../model/prediction-atoms";

export function PredictionOverlay() {
  const result = useAtomValue(predictionResultAtom);
  const selectedId = useAtomValue(selectedHypothesisIdAtom);
  const futureMinutes = useAtomValue(futureMinutesAtom);

  if (!result || result.status !== "success") return null;

  // 선택된 가설만 표시하거나, 없으면 전체 표시 (불투명도 조절 방식 등)
  const displayHypotheses = selectedId
    ? result.hypotheses.filter((h) => h.id === selectedId)
    : result.hypotheses;

  const maxMinutes = result.futureMinutes || 60;

  // 0~1 사이의 진행률 보간 (현재 시간 대비 예측 시간)
  // progress가 0에 가까우면 마지막 관측지점, 1이면 최종 예측 지점
  const progress = Math.min(1, Math.max(0, futureMinutes / maxMinutes));

  const lastObs = result.inputObservations[result.inputObservations.length - 1];

  // 폴리곤 중심을 마지막 관측지점에서 최종 예측지점으로 보간하며 크기도 축소/확대하는 헬퍼 함수
  const getInterpolatedPolygon = (originalPolygon: GeoJSON.Polygon) => {
    return originalPolygon.coordinates[0].map((coord) => {
      // coord: [lng, lat]
      // progress에 비례하여 크기도 키우고 중심도 이동 (단순 선형 보간의 근사치)
      const ilng = lastObs.lng + (coord[0] - lastObs.lng) * progress;
      const ilat = lastObs.lat + (coord[1] - lastObs.lat) * progress;
      return { lat: ilat, lng: ilng };
    });
  };

  return (
    <>
      {displayHypotheses.map((hyp) => (
        <div key={hyp.id}>
          {/* 예측 경로 폴리라인 */}
          {hyp.routeGeometry && (
            <Polyline
              path={hyp.routeGeometry.coordinates.map((c) => ({
                lat: c[1],
                lng: c[0],
              }))}
              strokeWeight={4}
              strokeColor={
                hyp.mode === "walking"
                  ? "#3B82F6" // blue-500
                  : hyp.mode === "transit"
                    ? "#22C55E" // green-500
                    : "#EF4444" // red-500
              }
              strokeOpacity={hyp.id === selectedId ? 0.9 : 0.6}
              strokeStyle="shortdash"
              zIndex={40}
            />
          )}

          {/* Low Confidence Polygon */}
          <Polygon
            path={getInterpolatedPolygon(hyp.confidenceZone.low)}
            strokeWeight={1}
            strokeColor="#ffeb3b"
            strokeOpacity={0.8}
            fillColor="#ffeb3b"
            fillOpacity={0.1}
          />
          {/* Medium Confidence Polygon */}
          <Polygon
            path={getInterpolatedPolygon(hyp.confidenceZone.medium)}
            strokeWeight={1}
            strokeColor="#ff9800"
            strokeOpacity={0.8}
            fillColor="#ff9800"
            fillOpacity={0.2}
          />
          {/* High Confidence Polygon */}
          <Polygon
            path={getInterpolatedPolygon(hyp.confidenceZone.high)}
            strokeWeight={2}
            strokeColor="#f44336"
            strokeOpacity={0.8}
            fillColor="#f44336"
            fillOpacity={0.4}
          />

          {/* Predicted Position Marker (CustomOverlayMap 활용) */}
          <CustomOverlayMap
            position={{
              // 위치 보간 (단순 선형, 추후 routeGeometry 기반 보간 가능)
              lat:
                lastObs.lat +
                (hyp.currentPosition.lat - lastObs.lat) * progress,
              lng:
                lastObs.lng +
                (hyp.currentPosition.lng - lastObs.lng) * progress,
            }}
            yAnchor={1}
            zIndex={50}
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full border-2 border-white shadow-md ${
                  hyp.mode === "walking"
                    ? "bg-blue-500"
                    : hyp.mode === "transit"
                      ? "bg-green-500"
                      : "bg-red-500"
                }`}
              />
              <span className="text-xs font-bold text-white bg-black/70 px-1 py-0.5 rounded mt-1 shadow-lg">
                {hyp.mode} {(hyp.probability * 100).toFixed(0)}%
                {hyp.estimatedDestination && (
                  <span className="block text-[10px] text-gray-300 font-normal mt-0.5">
                    목적지: {hyp.estimatedDestination.name}
                  </span>
                )}
              </span>
            </div>
          </CustomOverlayMap>
        </div>
      ))}
    </>
  );
}
