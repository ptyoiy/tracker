// src/features/route-analysis/ui/RouteCard.tsx
"use client";

import { useAtom } from "jotai";
import type { RouteInfo } from "@/types/analyze";
import { selectedRouteIdsAtom } from "../model/atoms";

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
  const isSelected = selectedIds.has(route.id);

  const toggleSelect = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(route.id)) {
        next.delete(route.id);
        return next;
      }
      if (next.size >= 3) {
        // 최대 3개까지
        return next;
      }
      next.add(route.id);
      return next;
    });
  };

  const primaryModeLabel = getPrimaryModeLabel(route.primaryMode);
  const distanceKm = Math.round(route.totalDistanceKm * 10) / 10;
  const durationMinutes = Math.round(route.totalDurationSeconds / 60);

  // (선택) CCTV 개수 합산: legs에 cctvCount 같은 필드가 있다면 여기서 합산
  // const cctvCount = route.legs.reduce((sum, leg) => sum + (leg.cctvCount ?? 0), 0);

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
        {durationMinutes}분{/* , 세그먼트 내 CCTV {cctvCount}대 */}
      </div>
    </button>
  );
}
