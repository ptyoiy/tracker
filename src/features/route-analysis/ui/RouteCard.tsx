"use client";

import { useAtom } from "jotai";
import { Card } from "@/shared/ui/card";
import type { SegmentAnalysis } from "@/types/analyze";
import { selectedRouteIdsAtom } from "../model/atoms";

type Props = {
  segment: SegmentAnalysis;
};

export function RouteCard({ segment }: Props) {
  const [selectedRouteIds, setSelectedRouteIds] = useAtom(selectedRouteIdsAtom);

  const {
    id,
    fromIndex,
    toIndex,
    distanceKm,
    durationSeconds,
    averageSpeedKmh,
    inferredMode,
    candidateRoutes,
  } = segment;

  const minutes = Math.round(durationSeconds / 60);

  const sortedCandidates = [...candidateRoutes].sort(
    (a, b) => a.totalDurationSeconds - b.totalDurationSeconds,
  );
  const topRoute = sortedCandidates[0];

  const handleToggleTopRoute = () => {
    if (!topRoute) return;

    setSelectedRouteIds((prev) => {
      const next = new Set(prev);
      if (next.has(topRoute.id)) {
        next.delete(topRoute.id);
        return next;
      }
      if (next.size >= 3) return next; // 최대 3개
      next.add(topRoute.id);
      return next;
    });
  };

  const isTopSelected = topRoute ? selectedRouteIds.has(topRoute.id) : false;

  return (
    <Card className="p-3 text-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">
          구간 #{fromIndex + 1} → #{toIndex + 1}
        </span>
        <span className="text-xs uppercase text-gray-500">{inferredMode}</span>
      </div>

      <div className="text-xs text-gray-600">
        거리 {distanceKm.toFixed(2)} km · 시간 {minutes}분 · 평균 속도{" "}
        {averageSpeedKmh.toFixed(1)} km/h
      </div>

      <div className="flex items-center justify-between text-xs text-gray-700">
        {candidateRoutes.length === 0 ? (
          <span>TMAP 경로 후보 없음</span>
        ) : (
          <span>
            TMAP 후보 {candidateRoutes.length}개 · 최단{" "}
            {Math.round((topRoute?.totalDurationSeconds ?? 0) / 60)}분 /{" "}
            {(topRoute?.totalDistanceKm ?? 0).toFixed(1)} km ·{" "}
            <span className="uppercase">{topRoute?.primaryMode}</span>
          </span>
        )}

        {topRoute && (
          <button
            type="button"
            onClick={handleToggleTopRoute}
            className={`px-2 py-1 rounded border text-[11px] ${
              isTopSelected
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            {isTopSelected ? "대표 경로 해제" : "대표 경로 선택"}
          </button>
        )}
      </div>
    </Card>
  );
}
