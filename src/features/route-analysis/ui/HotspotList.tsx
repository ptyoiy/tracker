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

export function HotspotList() {
  const lastParams = useAtomValue(lastAnalysisParamsAtom);
  const { data } = useAnalyzeQuery(
    lastParams?.observations,
    lastParams?.futureMinutes,
  );
  const [activeHotspotId, setActiveHotspotId] = useAtom(activeHotspotIdAtom);
  const setSelectedRouteIds = useSetAtom(selectedRouteIdsAtom);
  const setMapCenter = useSetAtom(mapCenterCommandAtom);

  const hotspots = data?.hotspotSegments ?? [];
  if (hotspots.length === 0) return null;

  // 상위 7개 (coverageRatio > cctvCount > length 정렬)
  const topHotspots = [...hotspots]
    .sort((a, b) => {
      if (b.coverageRatio !== a.coverageRatio)
        return b.coverageRatio - a.coverageRatio;
      const bCctv = b.cctvCount ?? 0;
      const aCctv = a.cctvCount ?? 0;
      if (bCctv !== aCctv) return bCctv - aCctv;
      return b.lengthMeters - a.lengthMeters;
    })
    .slice(0, 7);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Flame className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-bold text-gray-800">겹침 경로 (핫스팟)</h3>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory px-1 custom-scrollbar">
        {topHotspots.map((hot) => {
          const isActive = activeHotspotId === hot.id;
          return (
            <button
              key={hot.id}
              type="button"
              className={cn(
                "snap-center shrink-0 min-w-[200px] text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm relative overflow-hidden",
                isActive
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
                      yOffset: window.innerHeight * 0.25, // offset UI padding
                    });
                  }
                  // 연관된 경로 강조
                  setSelectedRouteIds(new Set(hot.coveredRouteIds));
                }
              }}
            >
              {isActive && (
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
              )}
              <div className="flex justify-between items-start mb-1">
                <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                  {Math.round(hot.coverageRatio * 100)}% 겹침
                </span>
                <span className="text-[10px] text-gray-500 font-medium">
                  {Math.round(hot.lengthMeters)}m
                </span>
              </div>
              <div className="text-xs font-bold text-gray-800 mt-1 flex items-center gap-1">
                {hot.coveredRouteIds.length}개 경로 통과
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {hot.modes.map((mode) => (
                  <span
                    key={mode}
                    className="text-[10px] bg-white border border-gray-200 shadow-sm px-1.5 py-[1px] rounded flex items-center text-gray-600"
                  >
                    {mode === "walking"
                      ? "🚶"
                      : mode === "transit"
                        ? "🚌"
                        : "🚗"}{" "}
                    {mode === "walking"
                      ? "도보"
                      : mode === "transit"
                        ? "대중교통"
                        : "차량"}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
