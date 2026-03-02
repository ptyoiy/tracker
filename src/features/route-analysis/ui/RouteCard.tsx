// src/features/route-analysis/ui/RouteCard.tsx
"use client";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import type { RouteInfo } from "@/types/analyze";
import { useAtom, useAtomValue } from "jotai";
import { Check, Repeat } from "lucide-react";
import {
  analysisResultAtom,
  routeCctvCountAtom,
  selectedRouteIdsAtom,
} from "../model/atoms";

type Props = {
  route: RouteInfo;
  index: number;
};

function getPrimaryModeLabel(mode: RouteInfo["primaryMode"]) {
  switch (mode) {
    case "walking":
      return { icon: "🚶", text: "도보" };
    case "transit":
      return { icon: "🚌", text: "대중교통" };
    case "vehicle":
      return { icon: "🚗", text: "차량" };
    default:
      return { icon: "🔍", text: "기타" };
  }
}

function getModeColor(mode: RouteInfo["primaryMode"]) {
  switch (mode) {
    case "walking":
      return "border-l-gray-400";
    case "transit":
      return "border-l-green-500";
    case "vehicle":
      return "border-l-blue-500";
    default:
      return "border-l-gray-300";
  }
}

function getLegIcon(mode: string) {
  switch (mode) {
    case "WALK":
      return "🚶";
    case "BUS":
      return "🚌";
    case "SUBWAY":
      return "🚇";
    case "CAR":
      return "🚗";
    default:
      return "📍";
  }
}

export function RouteCard({ route, index }: Props) {
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

  const { icon: modeIcon, text: primaryModeLabel } = getPrimaryModeLabel(
    route.primaryMode,
  );
  const stripeColor = getModeColor(route.primaryMode);

  const distanceKm = Math.round(route.totalDistanceKm * 10) / 10;
  const durationMinutes = Math.round(route.totalDurationSeconds / 60);

  // 대중교통 구간인 경우 leg를 사용하여 bar 형태를 그리기 위한 정보 추출
  const transitLegs =
    route.primaryMode === "transit"
      ? route.legs.filter((l) => l.durationSeconds > 0)
      : [];

  return (
    <button
      type="button"
      disabled={isStale}
      className={cn(
        "group w-full text-left rounded-xl border-y-2 border-r-2 border-l-[6px] p-3 transition-all duration-200 relative overflow-hidden flex flex-col gap-3",
        stripeColor,
        isSelected
          ? "border-y-blue-500 border-r-blue-500 bg-blue-50/50 shadow-md"
          : "border-y-gray-100 border-r-gray-100 bg-white hover:border-y-blue-200 hover:border-r-blue-200 hover:shadow-sm",
        isStale &&
          "opacity-60 grayscale-[0.5] border-y-gray-100 border-r-gray-100 hover:border-y-gray-100 hover:border-r-gray-100 hover:shadow-none bg-gray-50/50 cursor-default border-l-gray-300",
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

      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[14px] leading-none">{modeIcon}</span>
            <span className="text-[12px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              옵션 {index + 1}
            </span>
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
                className="bg-green-50 text-green-600 border-green-100 text-[10px] font-bold px-1.5 py-0 h-4"
              >
                유력
              </Badge>
            )}
            {!isStale && !route.isReasonable && (
              <Badge
                variant="outline"
                className="text-orange-500 border-orange-100 bg-orange-50/50 text-[10px] font-medium px-1.5 py-0 h-4"
              >
                시간차 큼
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-[12px] mt-0.5">
          <span
            className={cn(
              "font-black text-[15px]",
              isStale ? "text-gray-400" : "text-gray-900",
            )}
          >
            {durationMinutes}분 소요
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="text-[13px] font-bold text-gray-500">
            {distanceKm}km
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span
            className={cn(
              "font-bold text-[13px]",
              isStale ? "text-gray-300" : "text-gray-500",
            )}
          >
            CCTV {cctvCount}대
          </span>
        </div>
      </div>

      {transitLegs.length > 0 && (
        <div className="w-full mt-2 pt-3 border-t border-dashed border-gray-200 flex items-center flex-wrap gap-y-2 text-[11px] font-medium text-gray-600">
          {transitLegs.map((leg, legIdx: number) => (
            <div
              key={`${route.id}-leg-${legIdx}`}
              className="flex items-center gap-1.5"
            >
              <div
                className={cn(
                  "flex items-center gap-1 rounded px-1.5 py-0.5",
                  leg.mode === "WALK"
                    ? "bg-gray-100 text-gray-500"
                    : leg.mode === "BUS"
                      ? "bg-blue-50 border border-blue-100 text-blue-700"
                      : "bg-green-50 border border-green-100 text-green-700",
                )}
              >
                <span>{getLegIcon(leg.mode)}</span>
                {leg.route && <span className="font-bold">{leg.route}</span>}
                <span className="opacity-70">
                  {Math.round(leg.durationSeconds / 60)}분
                </span>
              </div>
              {legIdx < transitLegs.length - 1 && (
                <Repeat className="w-3 h-3 mx-0.5 text-gray-300" />
              )}
            </div>
          ))}
        </div>
      )}
    </button>
  );
}
