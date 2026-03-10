// src/features/transit-lookup/ui/SubwayStationCard.tsx
"use client";
import { apiClient } from "@/shared/api/client";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import {
  transitReferenceTimeAtom,
  transitSelectedModeAtom,
} from "../model/atoms";
import type { SubwayLineInfo, SubwayStationResult } from "../model/types";
import { RouteTraceView } from "./RouteTraceView";

export function SubwayStationCard({
  station,
}: {
  station: SubwayStationResult;
}) {
  const [traceRoute, setTraceRoute] = useState<{
    lineName: string;
  } | null>(null);
  const refTime = useAtomValue(transitReferenceTimeAtom);
  const selectedMode = useAtomValue(transitSelectedModeAtom);
  const referenceTime = refTime || new Date().toISOString();

  // 도착 정보 lazy-load: 카드가 표시될 때 개별 조회
  const { data: arrivalData, isLoading: arrivalLoading } = useQuery({
    queryKey: [
      "subway-station-arrivals",
      station.stationName,
      selectedMode,
      referenceTime,
    ],
    queryFn: async () => {
      const res = await apiClient
        .post("subway-station-arrivals", {
          json: {
            stationName: station.stationName,
            mode: selectedMode === "auto" ? undefined : selectedMode,
            referenceTime,
          },
        })
        .json<{ lines: SubwayLineInfo[] }>();
      return res.lines;
    },
    // 이미 lines 데이터가 있으면 스킵 (직접 조회 결과)
    enabled: station.lines.length === 0,
    staleTime: 30000,
    retry: 1,
  });

  // 기존 lines가 있으면 사용, 없으면 lazy-load 결과 사용
  const lines = station.lines.length > 0 ? station.lines : (arrivalData ?? []);

  if (traceRoute) {
    return (
      <RouteTraceView
        type="subway"
        routeId={traceRoute.lineName}
        routeName={traceRoute.lineName}
        boardingStationId={station.stationName}
        referenceTime={referenceTime}
        onClose={() => setTraceRoute(null)}
      />
    );
  }

  // 방향별로 그룹핑 (상행/내선 vs 하행/외선)
  const upLines = lines.filter(
    (l) => l.updnLine === "상행" || l.updnLine === "내선",
  );
  const downLines = lines.filter(
    (l) => l.updnLine === "하행" || l.updnLine === "외선",
  );
  const otherLines = lines.filter((l) => !l.updnLine);

  if (arrivalLoading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 flex items-center justify-center py-4 text-gray-400 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">도착 정보 조회 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {upLines.length > 0 && (
        <DirectionGroup
          label="⬆ 상행/내선"
          lines={upLines}
          onTraceClick={(actualLineName) =>
            setTraceRoute({ lineName: actualLineName })
          }
        />
      )}
      {downLines.length > 0 && (
        <DirectionGroup
          label="⬇ 하행/외선"
          lines={downLines}
          onTraceClick={(actualLineName) =>
            setTraceRoute({ lineName: actualLineName })
          }
        />
      )}
      {otherLines.length > 0 && (
        <DirectionGroup
          label="기타"
          lines={otherLines}
          onTraceClick={(actualLineName) =>
            setTraceRoute({ lineName: actualLineName })
          }
        />
      )}
      {lines.length === 0 && (
        <div className="text-xs text-gray-400 py-2 text-center">
          도착 정보 없음
        </div>
      )}
    </div>
  );
}

function DirectionGroup({
  label,
  lines,
  onTraceClick,
}: {
  label: string;
  lines: SubwayLineInfo[];
  onTraceClick: (lineName: string) => void;
}) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 flex flex-col gap-1">
      <div className="text-[11px] font-bold text-orange-600 pb-1 border-b border-gray-100 mb-1">
        {label}
      </div>
      {lines.map((line, idx) => (
        <div
          key={`${line.lineName}-${line.direction}-${idx}`}
          className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0"
        >
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              className="flex items-center gap-1 hover:underline text-left"
              onClick={() =>
                onTraceClick(line.stationLineName || line.lineName)
              }
              title="경유 역 보기"
            >
              <span className="font-bold text-orange-500 text-sm">
                {line.lineName}
              </span>
              <MapPin className="w-3 h-3 text-gray-400" />
            </button>
            <span className="text-xs text-gray-600">{line.direction}</span>
          </div>
          <div className="text-right">
            {line.mode === "realtime" ? (
              <span className="font-bold text-red-600 text-xs">
                {line.arrival}
              </span>
            ) : (
              <div className="flex flex-col gap-1 text-[11px] text-gray-600">
                {(() => {
                  const past = line.trains
                    .filter((t) => t.minutesFromRef <= 0)
                    .slice(-3);
                  const future = line.trains
                    .filter((t) => t.minutesFromRef > 0)
                    .slice(0, 3);
                  const combined = [...past, ...future];

                  return combined.map((t, tidx) => {
                    const showDivider =
                      tidx > 0 &&
                      t.minutesFromRef > 0 &&
                      combined[tidx - 1].minutesFromRef <= 0;

                    return (
                      <div key={`${t.trainNo}-${tidx}`}>
                        {showDivider && (
                          <div className="border-t border-dashed border-blue-200 my-0.5" />
                        )}
                        <div className="flex justify-end gap-2 items-center">
                          <span className="text-gray-400 font-mono">
                            {t.departureTime}
                          </span>
                          {t.isExpress && (
                            <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded font-bold">
                              급행
                            </span>
                          )}
                          <span
                            className={
                              t.minutesFromRef > 0
                                ? "font-semibold text-blue-600"
                                : "font-semibold text-gray-400"
                            }
                          >
                            {t.minutesFromRef > 0
                              ? `${t.minutesFromRef}분 후`
                              : `${Math.abs(t.minutesFromRef)}분 전`}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
