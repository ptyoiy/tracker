// src/features/route-analysis/ui/RouteCard.tsx
"use client";

import { useAtom, useAtomValue } from "jotai";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import type { RouteInfo } from "@/types/analyze";
import {
  analysisResultAtom,
  routeCctvCountAtom,
  selectedRouteIdsAtom,
} from "../model/atoms";

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
  const analysisResult = useAtomValue(analysisResultAtom);

  const isSelected = selectedIds.has(route.id);
  const cctvCount = cctvCounts[route.id] ?? 0;
  const isStale = analysisResult.stale;

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

  const transitLegDetails =
    route.primaryMode === "transit"
      ? Array.from(
          new Map(
            route.legs
              .filter((l) => l.mode !== "WALK" && l.route)
              .map((l) => [
                `${l.mode}-${l.route}`,
                { mode: l.mode, route: l.route },
              ]),
          ).values(),
        )
      : [];

  return (
    <button
      type="button"
      disabled={isStale}
      className={cn(
        "group w-full text-left rounded-xl border-2 p-3 transition-all duration-200 relative overflow-hidden",
        isSelected
          ? "border-blue-500 bg-blue-50/50 shadow-md"
          : "border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm",
        isStale &&
          "opacity-60 grayscale-[0.5] border-gray-100 hover:border-gray-100 hover:shadow-none bg-gray-50/50 cursor-default",
      )}
      onClick={toggleSelect}
    >
      {/* Selection Indicator Overlay */}
      {isSelected && !isStale && (
        <div className="absolute top-0 right-0 p-1 bg-blue-500 rounded-bl-lg shadow-sm">
          <Check
            className="w-3 h-3 text-white"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[14px] font-black",
                isSelected && !isStale ? "text-blue-700" : "text-gray-900",
                isStale && "text-gray-400",
              )}
            >
              {primaryModeLabel}
            </span>
            {!isStale && route.isReasonable && (
              <Badge
                variant="secondary"
                className="bg-green-50 text-green-600 border-green-100 text-[10px] font-bold px-1 py-0 h-4"
              >
                추천
              </Badge>
            )}
            {!isStale && !route.isReasonable && (
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

        {transitLegDetails.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {transitLegDetails.map((detail) => (
              <div
                key={`${detail.mode}-${detail.route}`}
                className="flex gap-1"
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] font-bold px-1.5 py-0 h-4",
                    isStale
                      ? "bg-gray-100 border-gray-200 text-gray-400"
                      : "bg-white border-gray-200 text-gray-500",
                  )}
                >
                  {detail.mode}
                </Badge>
                {detail.route && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-bold px-1.5 py-0 h-4",
                      isStale
                        ? "bg-gray-100 border-gray-200 text-gray-400"
                        : "bg-white border-gray-200 text-gray-500",
                    )}
                  >
                    {detail.route}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2.5 text-[12px] mt-0.5">
          <span
            className={cn(
              "font-black",
              isStale ? "text-gray-400" : "text-gray-700",
            )}
          >
            {durationMinutes}분 소요
          </span>
          <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
          <span
            className={cn(
              "font-bold",
              isStale ? "text-gray-300" : "text-gray-500",
            )}
          >
            CCTV {cctvCount}대
          </span>
        </div>
      </div>
    </button>
  );
}
