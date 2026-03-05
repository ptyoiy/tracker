// src/features/map-view/ui/SelectionOverlay.tsx
"use client";

import { useAnalyzeQuery } from "@/features/observation-input/lib/useAnalyzeQuery";
import {
  activeHotspotIdAtom,
  lastAnalysisParamsAtom,
  selectedRouteIdsAtom,
} from "@/features/route-analysis/model/atoms";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { useAtom, useAtomValue } from "jotai";
import { Flame, ListFilter, Route as RouteIcon, X } from "lucide-react";
import { activePopupAtom } from "../model/atoms";

export function SelectionOverlay() {
  const [selectedRouteIds, setSelectedRouteIds] = useAtom(selectedRouteIdsAtom);
  const [activeHotspotId, setActiveHotspotId] = useAtom(activeHotspotIdAtom);
  const lastParams = useAtomValue(lastAnalysisParamsAtom);
  const [activePopup, setActivePopup] = useAtom(activePopupAtom);

  const { data } = useAnalyzeQuery(
    lastParams?.observations,
    lastParams?.futureMinutes,
  );

  const activeHotspot = data?.hotspotSegments?.find(
    (h) => h.id === activeHotspotId,
  );

  const selectedRoutesData =
    data?.segments
      ?.flatMap((s) => s.candidateRoutes)
      ?.filter((r) => selectedRouteIds.has(r.id)) ?? [];

  const totalSelectionsCount =
    selectedRouteIds.size + (activeHotspotId ? 1 : 0);

  const isOpen = activePopup?.type === "selection-overlay";

  if (totalSelectionsCount === 0) {
    // 아무것도 선택된 것이 없으면 팝업 및 버튼 숨김
    if (isOpen) {
      // 강제로 닫음
      Promise.resolve().then(() => setActivePopup(null));
    }
    return null;
  }

  const handleToggle = () => {
    if (isOpen) {
      setActivePopup(null);
    } else {
      setActivePopup({ type: "selection-overlay" });
    }
  };

  return (
    <div className="absolute top-16 right-4 z-20 flex flex-col items-end gap-2">
      {/* 1. 토글 버튼 (Layers 버튼과 유사) */}
      <div className="relative">
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "shadow-md transition-colors",
            isOpen ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white/90",
          )}
          onClick={handleToggle}
          aria-label="선택 항목 모아보기"
        >
          <ListFilter className="w-5 h-5" />
        </Button>
        {/* 선택 개수 뱃지 */}
        <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm pointer-events-none">
          {totalSelectionsCount}
        </div>
      </div>

      {/* 2. 모아보기 창 (Popup) */}
      {isOpen && (
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl border w-64 max-h-[60vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">
              선택된 항목 모아보기
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedRouteIds(new Set());
                setActiveHotspotId(null);
                setActivePopup(null);
              }}
              className="text-[10px] font-semibold text-gray-500 hover:text-red-500 transition-colors px-1"
            >
              전체 해제
            </button>
          </div>

          <div className="overflow-y-auto p-2 flex flex-col gap-2">
            {/* 핫스팟 항목 */}
            {activeHotspot && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 flex items-start justify-between">
                <div className="flex flex-col gap-1 overflow-hidden pr-2">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span className="text-xs font-bold text-orange-800 truncate">
                      {Math.round(activeHotspot.coverageRatio * 100)}% 중복
                      핫스팟
                    </span>
                  </div>
                  <span className="text-[10px] text-orange-600">
                    길이: {Math.round(activeHotspot.lengthMeters)}m
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveHotspotId(null)}
                  className="p-1 shrink-0 rounded text-orange-400 hover:bg-orange-200 hover:text-orange-700 transition-colors"
                  aria-label="제거"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 경로 옵션 항목들 */}
            {selectedRoutesData.map((route) => {
              const busNumbers = [
                ...new Set(
                  route.legs
                    .filter((l) => l.mode === "BUS")
                    .map((l) => l.route)
                    .filter(Boolean),
                ),
              ].join(", ");

              return (
                <div
                  key={route.id}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-start justify-between"
                >
                  <div className="flex flex-col gap-1 overflow-hidden pr-2">
                    <div className="flex items-center gap-1.5">
                      <RouteIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="text-xs font-bold text-blue-800 truncate">
                        {route.primaryMode === "walking"
                          ? "도보 경로"
                          : busNumbers
                            ? `${busNumbers}번 버스`
                            : "경로 옵션"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-600">
                      <span>
                        {Math.round(route.totalDurationSeconds / 60)}분
                      </span>
                      <span>·</span>
                      <span>{route.totalDistanceKm.toFixed(1)}km</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRouteIds((prev) => {
                        const next = new Set(prev);
                        next.delete(route.id);
                        return next;
                      });
                    }}
                    className="p-1 shrink-0 rounded text-blue-400 hover:bg-blue-200 hover:text-blue-700 transition-colors"
                    aria-label="제거"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
