// src/features/route-analysis/ui/RouteCard.tsx
"use client";

import { useAtom, useAtomValue } from "jotai";
import type { RouteInfo } from "@/types/analyze";
import { routeCctvCountAtom, selectedRouteIdsAtom } from "../model/atoms";

type Props = {
  route: RouteInfo;
};

function getPrimaryModeLabel(mode: RouteInfo["primaryMode"]) {
  switch (mode) {
    case "walking":
      return "도보";
    case "transit":
      return "대중교통";
    case "vehicle":
      return "차량";
    default:
      return "기타";
  }
}

export function RouteCard({ route }: Props) {
  const [selectedIds, setSelectedIds] = useAtom(selectedRouteIdsAtom);
  const cctvCounts = useAtomValue(routeCctvCountAtom);

  const isSelected = selectedIds.has(route.id);
  const cctvCount = cctvCounts[route.id] ?? 0;

  const toggleSelect = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(route.id)) {
        next.delete(route.id);
        return next;
      }
      if (next.size >= 3) {
        return next;
      }
      next.add(route.id);
      return next;
    });
  };

  const primaryModeLabel = getPrimaryModeLabel(route.primaryMode);
  const distanceKm = Math.round(route.totalDistanceKm * 10) / 10;
  const durationMinutes = Math.round(route.totalDurationSeconds / 60);

  return (
    <button
      type="button"
      className={`rounded border p-3 text-sm cursor-pointer ${
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
      }`}
      onClick={toggleSelect}
    >
      <div className="flex items-center justify-between">
        <span>{primaryModeLabel}</span>
        <span>{distanceKm} km</span>
      </div>
      <div className="text-xs text-gray-600">
        {durationMinutes}분 · CCTV {cctvCount}대
      </div>
    </button>
  );
}
