// src/features/route-analysis/ui/RouteGroupCard.tsx
"use client";

import { hoveredRouteIdAtom } from "@/features/map-view/model/atoms";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import type { RouteGroup, RouteInfo } from "@/types/analyze";
import { useAtom, useAtomValue } from "jotai";
import { Check } from "lucide-react";
import {
  analysisResultAtom,
  routeCctvCountAtom,
  selectedRouteIdsAtom,
} from "../model/atoms";

type Props = {
  group: RouteGroup;
  candidateRoutes: RouteInfo[];
};

export function RouteGroupCard({ group, candidateRoutes }: Props) {
  const [selectedIds, setSelectedIds] = useAtom(selectedRouteIdsAtom);
  const [, setHoveredRouteId] = useAtom(hoveredRouteIdAtom);
  const cctvCounts = useAtomValue(routeCctvCountAtom);
  const analysisResult = useAtomValue(analysisResultAtom);
  const isStale = analysisResult.stale;

  // 이 그룹에 포함된 RouteInfo만 추출 (최적 경로 우선 정렬됨)
  const groupRoutes = candidateRoutes.filter((r) =>
    group.memberRouteIds.includes(r.id),
  );

  // 그룹 내 전체 CCTV 범위를 계산
  const cctvCountsInGroup = groupRoutes.map((r) => cctvCounts[r.id] ?? 0);
  const minCctv = Math.min(...cctvCountsInGroup);
  const maxCctv = Math.max(...cctvCountsInGroup);
  const cctvSummary =
    minCctv === maxCctv ? `${minCctv}대` : `${minCctv}~${maxCctv}대`;

  const minDuration = Math.round(group.durationRange[0] / 60);
  const maxDuration = Math.round(group.durationRange[1] / 60);
  const durationSummary =
    minDuration === maxDuration
      ? `${minDuration}분`
      : `${minDuration}~${maxDuration}분`;
  const getLegIcon = (mode: string) => {
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
        return "";
    }
  };

  return (
    <div
      className={cn(
        "w-full text-left rounded-xl border-2 border-gray-200 p-3 flex flex-col gap-3 transition-colors bg-white",
        isStale && "opacity-60 grayscale-[0.5] bg-gray-50/50 cursor-default",
      )}
    >
      {/* 그룹 헤더 영역 */}
      <div className="flex flex-col gap-1 w-full border-b pb-3 mb-1 border-dashed border-gray-200">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-100 font-black text-[10px] px-1.5 py-0 h-4"
          >
            공통 버스 구간
          </Badge>
          <span className="text-[13px] font-black text-gray-900 truncate">
            {group.busNumbers.join(", ")} 외{" "}
            {group.busNumbers.length > 2
              ? group.memberRouteIds.length - group.busNumbers.length
              : 0}
            개
          </span>
        </div>

        <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mt-0.5 flex-wrap">
          <span>총 {durationSummary}</span>
          <span className="opacity-40">|</span>
          <span>CCTV {cctvSummary}</span>
        </div>
      </div>

      {/* 내부 리스트 라인 */}
      <div className="flex flex-col gap-1.5">
        {groupRoutes.map((route, idx) => {
          const isSelected = selectedIds.has(route.id);
          const cctvCount = cctvCounts[route.id] ?? 0;
          const duration = Math.round(route.totalDurationSeconds / 60);

          const busLeg = route.legs.find((l) => l.mode === "BUS");

          const toggleSelect = () => {
            if (isStale) return;
            setSelectedIds((prev) => {
              const next = new Set(prev);
              if (next.has(route.id)) next.delete(route.id);
              else next.add(route.id);
              return next;
            });
          };

          return (
            <button
              key={route.id}
              type="button"
              disabled={isStale}
              onClick={toggleSelect}
              onMouseEnter={() => !isStale && setHoveredRouteId(route.id)}
              onMouseLeave={() => !isStale && setHoveredRouteId(null)}
              className={cn(
                "group relative w-full flex items-center justify-between py-2 px-2.5 rounded-lg border-2 text-left transition-all overflow-hidden",
                isSelected
                  ? "bg-blue-50/50 border-blue-500 shadow-sm"
                  : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200",
              )}
            >
              {/* Selection Indicator Overlay */}
              {isSelected && !isStale && (
                <div className="absolute top-0 right-0 p-[3px] bg-blue-500 rounded-bl flex items-center justify-center">
                  <Check
                    className="w-2.5 h-2.5 text-white"
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-bold text-gray-800 flex items-center gap-1.5">
                    옵션 {idx + 1}
                    {busLeg?.route && (
                      <span className="text-indigo-600 bg-indigo-50/50 px-1 rounded-sm text-[11px] font-black border border-indigo-100">
                        {busLeg.route}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium mt-1">
                    <span className="font-bold text-gray-700">
                      {duration}분
                    </span>
                    <span className="opacity-40">·</span>
                    <span>CCTV {cctvCount}대</span>
                  </div>

                  {/* 개별 탑승 다이어그램 */}
                  <div className="flex items-center gap-0.5 mt-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
                    {route.legs
                      .filter((leg) => leg.durationSeconds > 0)
                      .map((leg, i, filteredLegs) => (
                        <span
                          key={i.toString()}
                          className="flex items-center gap-0.5 shrink-0"
                        >
                          <span
                            className={cn(
                              "flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px]",
                              leg.mode === "WALK"
                                ? "bg-gray-100 text-gray-500"
                                : leg.mode === "BUS"
                                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                                  : "bg-green-50 text-green-700 border border-green-100",
                            )}
                          >
                            {getLegIcon(leg.mode)}
                            {leg.route && (
                              <span className="font-bold">{leg.route}</span>
                            )}
                            <span className="opacity-70">
                              {Math.round(leg.durationSeconds / 60)}분
                            </span>
                          </span>
                          {i < filteredLegs.length - 1 && (
                            <span className="opacity-40 text-[10px] px-0.5">
                              →
                            </span>
                          )}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {route.isReasonable && (
                  <span className="text-green-500 text-[10px] font-bold bg-green-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    유력
                  </span>
                )}
                {isSelected && (
                  <Check
                    className="w-4 h-4 text-indigo-500 shrink-0"
                    strokeWidth={3}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
