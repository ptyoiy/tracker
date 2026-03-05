"use client";

import { useAnalyzeQuery } from "@/features/observation-input/lib/useAnalyzeQuery";
import {
  activeHotspotIdAtom,
  lastAnalysisParamsAtom,
} from "@/features/route-analysis/model/atoms";
import { cn } from "@/shared/lib/utils";
import { useAtom, useAtomValue } from "jotai";
import { Flame } from "lucide-react";
import { CustomOverlayMap, Polyline } from "react-kakao-maps-sdk";

export function HotspotMarkers() {
  const lastParams = useAtomValue(lastAnalysisParamsAtom);
  const { data } = useAnalyzeQuery(
    lastParams?.observations,
    lastParams?.futureMinutes,
  );
  const [activeHotspotId, setActiveHotspotId] = useAtom(activeHotspotIdAtom);

  const hotspots = data?.hotspotSegments ?? [];
  if (hotspots.length === 0) return null;

  return (
    <>
      {hotspots.map((hot) => {
        const isActive = activeHotspotId === hot.id;

        return (
          <div key={`hotspot-${hot.id}`}>
            {/* 핫스팟 세그먼트 라인 */}
            <Polyline
              path={hot.polyline}
              strokeWeight={isActive ? 12 : 8}
              strokeColor="#f97316" // orange-500
              strokeOpacity={isActive ? 0.9 : 0.6}
              strokeStyle="solid"
              zIndex={isActive ? 45 : 35}
            />
            {/* 내부 점선 효과 (바 모양) */}
            <Polyline
              path={hot.polyline}
              strokeWeight={isActive ? 6 : 4}
              strokeColor="#fff"
              strokeOpacity={0.8}
              strokeStyle="shortdash"
              zIndex={isActive ? 46 : 36}
            />

            {/* 핫스팟 앵커 마커 */}
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
                    "flex flex-col items-center group -mt-2 transition-transform cursor-pointer",
                    isActive ? "scale-110" : "scale-100 hover:scale-105",
                  )}
                  onClick={() => setActiveHotspotId(isActive ? null : hot.id)}
                >
                  <div className="bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap mb-0.5 relative z-10 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-200" />
                    {hot.coveredRouteIds.length}개 경로 겹침
                  </div>
                  <div
                    className={cn(
                      "w-5 h-5 bg-white border-2 rounded-full flex items-center justify-center shadow-md relative z-10",
                      isActive ? "border-orange-600" : "border-orange-400",
                    )}
                  >
                    <span className="text-[10px]">🔥</span>
                  </div>
                </button>
              </CustomOverlayMap>
            )}

            {/* 활성 상태 툴팁 */}
            {isActive && hot.anchorPoint && (
              <CustomOverlayMap
                position={{
                  lat: hot.anchorPoint.lat,
                  lng: hot.anchorPoint.lng,
                }}
                yAnchor={2.5}
                zIndex={100}
              >
                <div className="bg-white rounded-lg shadow-xl border border-orange-200 px-3 py-2 min-w-[150px] pointer-events-none">
                  <div className="flex items-center gap-1.5 mb-1 text-orange-600 font-bold text-xs">
                    <Flame className="w-3.5 h-3.5" />
                    {Math.round(hot.coverageRatio * 100)}% 통과 구간
                  </div>
                  <div className="text-[10px] text-gray-600 space-y-0.5 mt-1.5 pt-1.5 border-t border-gray-100">
                    <div className="flex justify-between">
                      <span>길이:</span>
                      <span className="font-medium text-gray-900">
                        {Math.round(hot.lengthMeters)}m
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
