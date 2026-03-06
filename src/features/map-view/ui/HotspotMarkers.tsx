"use client";

import { useAnalyzeQuery } from "@/features/observation-input/lib/useAnalyzeQuery";
import {
  activeHotspotIdAtom,
  lastAnalysisParamsAtom,
  selectedRouteIdsAtom,
} from "@/features/route-analysis/model/atoms";
import { cn } from "@/shared/lib/utils";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { X } from "lucide-react";
import { CustomOverlayMap, Polyline } from "react-kakao-maps-sdk";
import { activePopupAtom } from "../model/atoms";

export function HotspotMarkers() {
  const lastParams = useAtomValue(lastAnalysisParamsAtom);
  const { data } = useAnalyzeQuery(
    lastParams?.observations,
    lastParams?.futureMinutes,
  );
  const [activeHotspotId, setActiveHotspotId] = useAtom(activeHotspotIdAtom);
  const setActivePopup = useSetAtom(activePopupAtom);
  const selectedRouteIds = useAtomValue(selectedRouteIdsAtom);
  const hasSelectedRoutes = selectedRouteIds.size > 0;

  const hotspots = data?.hotspotSegments ?? [];
  if (hotspots.length === 0) return null;

  return (
    <>
      {hotspots.map((hot) => {
        const isActive = activeHotspotId === hot.id;

        return (
          <div key={`hotspot-${hot.id}`}>
            {/* 중복 경로 세그먼트 라인 */}
            <Polyline
              path={hot.polyline}
              strokeWeight={isActive ? 12 : 8}
              strokeColor="#f97316"
              strokeOpacity={isActive ? 0.9 : hasSelectedRoutes ? 0.2 : 0.6}
              strokeStyle="solid"
              zIndex={isActive ? 45 : 35}
            />
            {/* 내부 점선 효과 */}
            <Polyline
              path={hot.polyline}
              strokeWeight={isActive ? 6 : 4}
              strokeColor="#fff"
              strokeOpacity={isActive ? 0.8 : hasSelectedRoutes ? 0.3 : 0.8}
              strokeStyle="shortdash"
              zIndex={isActive ? 46 : 36}
            />

            {/* 앵커 마커 (텍스트 없이 아이콘만) */}
            {hot.anchorPoint && (
              <CustomOverlayMap
                position={{
                  lat: hot.anchorPoint.lat,
                  lng: hot.anchorPoint.lng,
                }}
                yAnchor={1}
                zIndex={isActive ? 60 : 40}
                clickable
              >
                <button
                  type="button"
                  className={cn(
                    "flex flex-col items-center group transition-all duration-300 cursor-pointer",
                    isActive
                      ? "scale-125 opacity-100"
                      : hasSelectedRoutes
                        ? "scale-100 opacity-40 hover:opacity-100 hover:scale-110"
                        : "scale-100 opacity-100 hover:scale-110",
                  )}
                  onClick={() => {
                    const nextId = isActive ? null : hot.id;
                    setActiveHotspotId(nextId);
                    if (nextId) {
                      setActivePopup({ type: "hotspot", id: nextId });
                    } else {
                      setActivePopup(null);
                    }
                  }}
                >
                  <div
                    className={cn(
                      "w-7 h-7 bg-white border-2 rounded-full flex items-center justify-center shadow-lg relative z-10",
                      isActive
                        ? "border-orange-600 ring-2 ring-orange-300"
                        : "border-orange-400",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-black",
                        isActive ? "text-orange-600" : "text-gray-700",
                      )}
                    >
                      {Math.round(hot.coverageRatio * 100)}%
                    </span>
                  </div>
                </button>
              </CustomOverlayMap>
            )}

            {/* 활성 상태 팝업 (닫기 버튼 포함) */}
            {isActive && hot.anchorPoint && (
              <CustomOverlayMap
                position={{
                  lat: hot.anchorPoint.lat,
                  lng: hot.anchorPoint.lng,
                }}
                yAnchor={1.8}
                zIndex={100}
                clickable
              >
                <div className="bg-white rounded-lg shadow-xl border border-orange-200 px-3 py-2 min-w-[150px] relative">
                  <button
                    type="button"
                    className="absolute top-1.5 right-1.5 text-gray-400 hover:text-gray-600 z-10"
                    onClick={() => {
                      setActiveHotspotId(null);
                      setActivePopup(null);
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center gap-1.5 mb-1 text-orange-600 font-bold text-xs pr-5">
                    {(() => {
                      const parts = hot.segmentId.split("-");
                      const fromStr = parts[0];
                      const toStr = parts[1];
                      if (fromStr && toStr) {
                        return `${parseInt(fromStr, 10) + 1} → ${parseInt(toStr, 10) + 1} 관측 지점`;
                      }
                      return "중복 구간";
                    })()}
                  </div>
                  <div className="text-[10px] text-gray-600 space-y-1 mt-1.5 pt-1.5 border-t border-gray-100">
                    <div className="flex justify-between items-center bg-orange-50 px-1.5 py-0.5 rounded text-orange-700 font-bold mb-1 gap-2">
                      <span>중복 비율:</span>
                      <span>
                        {Math.round(hot.coverageRatio * 100)}% (
                        {hot.coveredRouteIds.length}/
                        {hot.coverageRatio > 0
                          ? Math.round(
                              hot.coveredRouteIds.length / hot.coverageRatio,
                            )
                          : 0}
                        )
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>길이:</span>
                      <span className="font-medium text-gray-900">
                        {Math.round(hot.lengthMeters)}m
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>경로:</span>
                      <span className="font-medium text-gray-900">
                        {hot.coveredRouteIds.length}개 경로 중복
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>수단:</span>
                      <span className="font-medium text-gray-900">
                        {hot.modes
                          .map((m) =>
                            m === "walking"
                              ? "도보"
                              : m === "transit"
                                ? "대중교통"
                                : "차량",
                          )
                          .join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
              </CustomOverlayMap>
            )}
          </div>
        );
      })}
    </>
  );
}
