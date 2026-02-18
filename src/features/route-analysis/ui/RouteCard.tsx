"use client";

import { Card } from "@/shared/ui/card";
import type { SegmentAnalysis } from "@/types/analyze";

type Props = {
  segment: SegmentAnalysis;
};

export function RouteCard({ segment }: Props) {
  const {
    fromIndex,
    toIndex,
    distanceKm,
    durationSeconds,
    averageSpeedKmh,
    inferredMode,
  } = segment;

  const minutes = Math.round(durationSeconds / 60);

  return (
    <Card className="p-3 text-sm space-y-1">
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
    </Card>
  );
}
