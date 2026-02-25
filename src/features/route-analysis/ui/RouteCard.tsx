// src/features/route-analysis/ui/RouteCard.tsx
"use client";

import { useAtom, useAtomValue } from "jotai";
import { Badge } from "@/shared/ui/badge";
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

  // 대중교통의 경우 포함된 수단 추출
  const legModes =
    route.primaryMode === "transit"
      ? Array.from(new Set(route.legs.map((l) => l.mode))).filter(
          (m) => m !== "WALK",
        )
      : [];

  return (
    <button
      type="button"
      className={`w-full text-left rounded border p-3 text-sm cursor-pointer transition-colors ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-blue-300"
      }`}
      onClick={toggleSelect}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">{primaryModeLabel}</span>
            {route.isReasonable && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 border-green-200"
              >
                합리적
              </Badge>
            )}
          </div>
          {legModes.length > 0 && (
            <div className="flex gap-1">
              {legModes.map((mode) => (
                <Badge
                  key={mode}
                  variant="outline"
                  className="text-[10px] px-1 py-0"
                >
                  {mode}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <span className="font-medium">{distanceKm} km</span>
      </div>
      <div className="text-xs text-gray-600 flex justify-between items-center">
        <span>
          {durationMinutes}분 · CCTV {cctvCount}대
        </span>
        {!route.isReasonable && (
          <span className="text-[10px] text-orange-600">시간차 큼</span>
        )}
      </div>
    </button>
  );
}
