"use client";

import { mapCenterCommandAtom } from "@/features/map-view/model/atoms";
import { useAnalyzeQuery } from "@/features/observation-input/lib/useAnalyzeQuery";
import { cn } from "@/shared/lib/utils";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Flame } from "lucide-react";
import {
  activeHotspotIdAtom,
  lastAnalysisParamsAtom,
  selectedRouteIdsAtom,
} from "../model/atoms";

type Props = {
  segmentId: string;
};

export function HotspotList({ segmentId }: Props) {
  const lastParams = useAtomValue(lastAnalysisParamsAtom);
  const { data } = useAnalyzeQuery(
    lastParams?.observations,
    lastParams?.futureMinutes,
  );
  const [activeHotspotId, setActiveHotspotId] = useAtom(activeHotspotIdAtom);
  const selectedRouteIds = useAtomValue(selectedRouteIdsAtom);
  const setMapCenter = useSetAtom(mapCenterCommandAtom);

  const allHotspots = data?.hotspotSegments ?? [];

  // 이 세그먼트에 해당하는 중복 경로만 필터링
  const segmentHotspots = allHotspots.filter((h) => h.segmentId === segmentId);
  if (segmentHotspots.length === 0) return null;

  // 사용자가 선택한 경로가 있으면 해당 경로들의 중복을 우선 표시
  const hasSelection = selectedRouteIds.size > 0;
  const selectedSet = selectedRouteIds;

  const sortedHotspots = [...segmentHotspots]
    .map((h) => {
      if (!hasSelection) {
        return { ...h, isSelectedBased: false };
      }

      // 선택된 경로 기준 정밀 재계산 (비율 및 갯수)
      const selectedCoveredIds = h.coveredRouteIds.filter((rid) =>
        selectedSet.has(rid),
      );
      const newCoverageRatio = selectedCoveredIds.length / selectedSet.size;
      return {
        ...h,
        coveredRouteIds: selectedCoveredIds,
        coverageRatio: newCoverageRatio,
        isSelectedBased: true,
      };
    })
    .filter((h) => {
      // 선택 사항이 있을 때는 선택된 노선들 중 2곳 이상 겹칠 때만 표시
      if (hasSelection) {
        return h.coveredRouteIds.length >= 2;
      }
      return true;
    })
    .sort((a, b) => {
      if (b.coverageRatio !== a.coverageRatio)
        return b.coverageRatio - a.coverageRatio;
      return b.lengthMeters - a.lengthMeters;
    })
    .slice(0, 7);

  return (
    <div className="mt-2 mb-1">
      <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
        <Flame className="w-3.5 h-3.5 text-orange-500" />
        <span className="text-[11px] font-bold text-gray-600">중복 경로</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1.5 snap-x snap-mandatory custom-scrollbar">
        {sortedHotspots.map((hot) => {
          const isActive = activeHotspotId === hot.id;
          return (
            <button
              key={hot.id}
              type="button"
              className={cn(
                "snap-center shrink-0 min-w-[170px] text-left p-2.5 rounded-lg border transition-all duration-200 cursor-pointer shadow-sm relative overflow-hidden",
                hot.isSelectedBased
                  ? isActive
                    ? "border-blue-500 ring-1 ring-blue-400 bg-blue-50"
                    : "border-blue-200 bg-blue-50/30 hover:border-blue-300"
                  : isActive
                    ? "border-orange-500 ring-1 ring-orange-500 bg-orange-50"
                    : "border-orange-200 bg-white hover:border-orange-300 hover:bg-orange-50/50",
              )}
              onClick={() => {
                if (isActive) {
                  setActiveHotspotId(null);
                } else {
                  setActiveHotspotId(hot.id);
                  if (hot.anchorPoint) {
                    setMapCenter({
                      lat: hot.anchorPoint.lat,
                      lng: hot.anchorPoint.lng,
                      yOffset: window.innerHeight * 0.25,
                    });
                  }
                }
              }}
            >
              {isActive && (
                <div
                  className={cn(
                    "absolute top-0 left-0 w-1 h-full",
                    hot.isSelectedBased ? "bg-blue-500" : "bg-orange-500",
                  )}
                />
              )}
              <div className="flex justify-between items-start mb-1">
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                    hot.isSelectedBased
                      ? "text-blue-600 bg-blue-100"
                      : "text-orange-600 bg-orange-100",
                  )}
                >
                  {Math.round(hot.coverageRatio * 100)}% 중복
                </span>
                <span className="text-[10px] text-gray-500 font-medium">
                  {Math.round(hot.lengthMeters)}m
                </span>
              </div>
              <div className="text-[11px] font-bold text-gray-800 mt-0.5">
                {hot.coveredRouteIds.length}/
                {hasSelection
                  ? selectedSet.size
                  : (data?.segments.find((s) => s.id === segmentId)
                      ?.candidateRoutes.length ?? allHotspots.length)}{" "}
                경로 중복
              </div>
              {hot.isSelectedBased && (
                <div className="text-[9px] text-blue-500 font-bold mt-0.5">
                  선택 경로 기반
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
