// src/features/map-view/ui/SelectionOverlay.tsx
"use client";

import { useAnalyzeQuery } from "@/features/observation-input/lib/useAnalyzeQuery";
import {
  activeHotspotIdAtom,
  lastAnalysisParamsAtom,
  selectedRouteIdsAtom,
} from "@/features/route-analysis/model/atoms";
import { useAtom, useAtomValue } from "jotai";
import { Flame, Route as RouteIcon, X } from "lucide-react";

export function SelectionOverlay() {
  const [selectedRouteIds, setSelectedRouteIds] = useAtom(selectedRouteIdsAtom);
  const [activeHotspotId, setActiveHotspotId] = useAtom(activeHotspotIdAtom);
  const lastParams = useAtomValue(lastAnalysisParamsAtom);

  const { data } = useAnalyzeQuery(
    lastParams?.observations,
    lastParams?.futureMinutes,
  );

  const hasSelections = selectedRouteIds.size > 0 || activeHotspotId !== null;

  if (!hasSelections) return null;

  const activeHotspot = data?.hotspotSegments?.find(
    (h) => h.id === activeHotspotId,
  );

  return (
    <div className="absolute top-16 right-4 z-20 flex flex-col gap-2 w-48 animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-none">
      {activeHotspot && (
        <div className="bg-white/95 backdrop-blur shadow-md rounded-lg border border-orange-200 p-2 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <Flame className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <span className="text-xs font-bold text-gray-700 truncate">
              {Math.round(activeHotspot.coverageRatio * 100)}% 중복 구간
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveHotspotId(null)}
            className="p-1 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="중복 구간 선택 해제"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {selectedRouteIds.size > 0 && (
        <div className="bg-white/95 backdrop-blur shadow-md rounded-lg border border-blue-200 p-2 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <RouteIcon className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-gray-700 truncate">
              {selectedRouteIds.size}개 옵션 켜짐
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedRouteIds(new Set())}
            className="p-1 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="경로 옵션 선택 해제"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
