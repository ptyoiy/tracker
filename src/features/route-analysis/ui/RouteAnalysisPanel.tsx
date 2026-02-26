// src/features/route-analysis/ui/RouteAnalysisPanel.tsx
"use client";

import { useAtomValue } from "jotai";
import { AlertCircle, ArrowRight, Navigation } from "lucide-react";
import { useAnalyzeQuery } from "@/features/observation-input/lib/useAnalyzeQuery";
import { observationsAtom } from "@/features/observation-input/model/atoms";
import { cn } from "@/shared/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { analysisResultAtom, lastAnalysisParamsAtom } from "../model/atoms";
import { RouteCard } from "./RouteCard";

export function RouteListPanel() {
  const lastParams = useAtomValue(lastAnalysisParamsAtom);
  const analysisResult = useAtomValue(analysisResultAtom);
  const currentObservations = useAtomValue(observationsAtom);

  const {
    data,
    isLoading: loading,
    error,
  } = useAnalyzeQuery(lastParams?.observations, lastParams?.futureMinutes);

  const segments = data?.segments;
  const isStale = analysisResult.stale;

  // 현재 관측 지점 데이터를 기반으로 각 세그먼트의 시간차와 라벨을 계산
  const enrichedSegments = segments?.map((segment) => {
    const fromObs = currentObservations[segment.fromIndex];
    const toObs = currentObservations[segment.toIndex];

    let durationSeconds = 0;
    if (fromObs && toObs) {
      const fromTime = new Date(fromObs.timestamp).getTime();
      const toTime = new Date(toObs.timestamp).getTime();
      durationSeconds = Math.abs(fromTime - toTime) / 1000;
    }

    return {
      ...segment,
      from: fromObs || segment.from,
      to: toObs || segment.to,
      durationSeconds: durationSeconds, // 현재 관측 지점 시간차로 업데이트
    };
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">
          최적의 경로를 분석하고 있습니다...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
        {error instanceof Error ? error.message : "경로 분석에 실패했습니다."}
      </div>
    );
  }

  if (!enrichedSegments || enrichedSegments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-center px-6">
        <Navigation className="w-12 h-12 mb-3 opacity-20" />
        <p className="text-[15px] font-bold text-gray-400">
          분석된 경로가 없습니다.
        </p>
        <p className="text-xs mt-1">
          관측 지점을 등록하고 분석을 시작해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("pb-10 transition-opacity", isStale && "opacity-70")}>
      {isStale && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-orange-50 border border-orange-100 rounded-xl text-[12px] text-orange-700 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          관측 지점이 변경되었습니다. 정확한 분석을 위해 재분석이 필요합니다.
        </div>
      )}

      <Accordion type="single" collapsible className="w-full space-y-3">
        {enrichedSegments.map((segment, idx) => {
          const routes = segment.candidateRoutes ?? [];

          return (
            <AccordionItem
              key={segment.id}
              value={segment.id}
              className={cn(
                "border rounded-xl px-3 bg-white overflow-hidden shadow-sm transition-all hover:border-blue-100",
                isStale && "hover:border-orange-100 bg-gray-50/30",
              )}
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center justify-between w-full pr-2">
                  {/* Left: Segment Info */}
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-gray-900 text-white text-[10px] font-black rounded-md">
                          {idx + 1}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-300" />
                        <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-gray-900 text-white text-[10px] font-black rounded-md">
                          {idx + 2}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 truncate text-[13px] font-bold text-gray-700 ml-1">
                        <span className="truncate max-w-[120px]">
                          {segment.from.address ||
                            segment.from.label ||
                            `지점 ${idx + 1}`}
                        </span>
                        <span className="text-gray-300">→</span>
                        <span className="truncate max-w-[120px]">
                          {segment.to.address ||
                            segment.to.label ||
                            `지점 ${idx + 2}`}
                        </span>
                        {isStale && (
                          <span className="ml-2 px-1.5 py-0.5 bg-gray-200 text-gray-500 text-[9px] rounded font-black whitespace-nowrap">
                            이전 결과
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actual Time Difference */}
                    <div className="flex items-center gap-2 ml-1 text-[11px] text-gray-400 font-medium">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-bold">
                        관측 시차: {Math.round(segment.durationSeconds / 60)}분
                      </span>
                      <span>·</span>
                      <span>직선 거리: {segment.distanceKm.toFixed(2)}km</span>
                    </div>
                  </div>

                  {/* Right: Count Summary */}
                  <div
                    className={cn(
                      "text-[11px] font-black px-2 py-1 rounded-md shrink-0 border ml-2",
                      isStale
                        ? "text-gray-400 bg-gray-100 border-gray-200"
                        : "text-blue-600 bg-blue-50 border-blue-100",
                    )}
                  >
                    {routes.length}개 옵션
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-0 pb-4">
                <div className="grid gap-2.5 pt-2 border-t border-gray-50">
                  {routes.length > 0 ? (
                    routes.map((route) => (
                      <RouteCard key={route.id} route={route} />
                    ))
                  ) : (
                    <div className="p-4 border border-dashed rounded-xl text-center text-xs text-gray-400 bg-gray-50/50">
                      해당 구간에서 검색된 경로가 없습니다.
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
