// src/features/route-analysis/ui/RouteCard.tsx
"use client";

import { useAtom, useAtomValue } from "jotai";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
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
      } else {
        next.add(route.id);
      }
      return next;
    });
  };

  const primaryModeLabel = getPrimaryModeLabel(route.primaryMode);
  const distanceKm = Math.round(route.totalDistanceKm * 10) / 10;
  const durationMinutes = Math.round(route.totalDurationSeconds / 60);

  const legModes =
    route.primaryMode === "transit"
      ? Array.from(new Set(route.legs.map((l) => l.mode))).filter(
          (m) => m !== "WALK",
        )
      : [];

  return (
    <button
      type="button"
      className={cn(
        "group w-full text-left rounded-xl border-2 p-3 transition-all duration-200 relative overflow-hidden",
        isSelected
          ? "border-blue-500 bg-blue-50/50 shadow-md"
          : "border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm",
      )}
      onClick={toggleSelect}
    >
      {/* Selection Indicator Overlay */}
      {isSelected && (
        <div className="absolute top-0 right-0 p-1 bg-blue-500 rounded-bl-lg shadow-sm">
          <Check className="w-3 h-3 text-white" strokeWidth={4} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[14px] font-black",
                isSelected ? "text-blue-700" : "text-gray-900",
              )}
            >
              {primaryModeLabel}
            </span>
            {route.isReasonable ? (
              <Badge
                variant="secondary"
                className="bg-green-50 text-green-600 border-green-100 text-[10px] font-bold px-1 py-0 h-4"
              >
                추천
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-orange-500 border-orange-100 bg-orange-50/50 text-[10px] font-medium px-1 py-0 h-4"
              >
                시간차 큼
              </Badge>
            )}
          </div>
          <span className="text-[13px] font-extrabold text-gray-400">
            {distanceKm}km
          </span>
        </div>

        {legModes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {legModes.map((mode) => (
              <Badge
                key={mode}
                variant="outline"
                className="text-[9px] font-bold px-1.5 py-0 bg-white border-gray-200 text-gray-500 h-4"
              >
                {mode}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2.5 text-[12px] mt-0.5">
          <span className="font-black text-gray-700">
            {durationMinutes}분 소요
          </span>
          <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
          <span className="font-bold text-gray-500">CCTV {cctvCount}대</span>
        </div>
      </div>
    </button>
  );
}
