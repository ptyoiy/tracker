// src/features/transit-lookup/ui/RouteTraceView.tsx
"use client";

import { apiClient } from "@/shared/api/client";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { ArrowLeft, MapPinned, Repeat } from "lucide-react";
import { useEffect, useState } from "react";
import { selectedRoutePathAtom } from "../model/atoms";
import type { RouteTraceRequest, RouteTraceResponse } from "../model/types";

type Props = {
  type: "bus" | "subway";
  routeId: string;
  routeName: string;
  boardingStationId: string;
  referenceTime: string;
  onClose: () => void;
};

export function RouteTraceView({
  type,
  routeId,
  routeName,
  boardingStationId,
  referenceTime,
  onClose,
}: Props) {
  const setRoutePath = useSetAtom(selectedRoutePathAtom);
  const [keepRoute, setKeepRoute] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "transit-trace",
      type,
      routeId,
      boardingStationId,
      referenceTime,
    ],
    queryFn: async () => {
      const body: RouteTraceRequest = {
        type,
        routeId,
        boardingStationId,
        referenceTime,
      };
      return apiClient
        .post("transit-trace", { json: body })
        .json<RouteTraceResponse>();
    },
  });

  // 데이터 로드 시 지도에 경로 + 정류소 정보 표시
  useEffect(() => {
    if (data && data.stops.length > 0) {
      const validStops = data.stops.filter((s) => s.lat !== 0 && s.lng !== 0);
      const validPath = validStops.map((s) => ({ lat: s.lat, lng: s.lng }));
      if (validPath.length >= 2) {
        setRoutePath({
          routeName: routeName,
          type,
          path: validPath,
          stops: validStops.map((s, idx) => ({
            lat: s.lat,
            lng: s.lng,
            stationName: s.stationName,
            cumulativeMinutes: s.cumulativeMinutes,
            isTransfer: s.isTransfer,
            isFirst: idx === 0,
          })),
        });
      }
    }
    // 언마운트 시 keepRoute가 아니면 경로 지우기
    return () => {
      if (!keepRoute) setRoutePath(null);
    };
  }, [data, routeName, type, setRoutePath, keepRoute]);

  const handleClose = () => {
    if (!keepRoute) setRoutePath(null);
    onClose();
  };

  return (
    <div className="flex flex-col gap-2">
      {/* 헤더 */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 shrink-0"
          onClick={handleClose}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <span>{type === "bus" ? "🚌" : "🚇"}</span>
            <span className="truncate">{routeName}</span>
          </span>
          {data && (
            <span className="text-[10px] text-gray-500 truncate">
              {data.boardingStation} → {data.direction}
            </span>
          )}
        </div>
        <Button
          variant={keepRoute ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-7 text-[10px] px-2 shrink-0 gap-1",
            keepRoute
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "text-gray-500 hover:text-blue-600",
          )}
          onClick={() => setKeepRoute((prev) => !prev)}
          title={
            keepRoute
              ? "경로 표시를 해제합니다"
              : "뒤로 가도 지도에 경로를 유지합니다"
          }
        >
          <MapPinned className="w-3 h-3" />
          {keepRoute ? "경로 고정" : "경로 고정"}
        </Button>
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="flex items-center justify-center py-6 text-gray-400">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
          <span className="text-sm">경유 정류장을 조회 중...</span>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="text-center py-4 text-sm text-red-500">
          정보를 불러오는 데 실패했습니다.
        </div>
      )}

      {/* 정류장 타임라인 리스트 */}
      {data && data.stops.length > 0 && (
        <div className="flex flex-col relative pl-4">
          {/* 세로선 */}
          <div
            className={cn(
              "absolute left-[7px] top-3 bottom-3 w-[2px]",
              type === "bus" ? "bg-blue-200" : "bg-orange-200",
            )}
          />

          {data.stops.map((stop, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === data.stops.length - 1;

            return (
              <div
                key={`${stop.stationId}-${stop.seq}`}
                className="flex items-start gap-3 relative py-1.5"
              >
                {/* 원형 마커 */}
                <div
                  className={cn(
                    "w-[14px] h-[14px] rounded-full border-2 shrink-0 z-10 mt-0.5 -ml-4",
                    isFirst
                      ? type === "bus"
                        ? "bg-blue-500 border-blue-600"
                        : "bg-orange-500 border-orange-600"
                      : isLast
                        ? "bg-gray-600 border-gray-700"
                        : stop.isTransfer
                          ? "bg-white border-yellow-500"
                          : "bg-white border-gray-300",
                  )}
                />

                {/* 정류장 정보 */}
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span
                      className={cn(
                        "text-[12px] font-semibold truncate",
                        isFirst ? "text-blue-700" : "text-gray-800",
                      )}
                    >
                      {stop.stationName}
                    </span>
                    {stop.isTransfer && (
                      <span className="text-[9px] font-bold text-yellow-600 bg-yellow-50 px-1 rounded w-fit flex items-center gap-0.5">
                        <Repeat className="w-2.5 h-2.5" />
                        환승
                      </span>
                    )}
                  </div>

                  <span
                    className={cn(
                      "text-[11px] font-bold shrink-0 ml-2",
                      isFirst
                        ? "text-gray-400"
                        : stop.cumulativeMinutes <= 10
                          ? "text-green-600"
                          : stop.cumulativeMinutes <= 20
                            ? "text-blue-600"
                            : "text-orange-600",
                    )}
                  >
                    {isFirst ? "승차" : `+${stop.cumulativeMinutes}분`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data && data.stops.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-400">
          조회 가능한 정류장이 없습니다 (운행종료 등).
        </div>
      )}
    </div>
  );
}
