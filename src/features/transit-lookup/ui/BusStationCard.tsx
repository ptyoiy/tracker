// src/features/transit-lookup/ui/BusStationCard.tsx
import { Badge } from "@/shared/ui/badge";
import type { BusStationResult } from "../model/types";

export function BusStationCard({ station }: { station: BusStationResult }) {
  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-900 text-sm">
          {station.stationName}
        </span>
        <span className="text-xs text-gray-500">({station.distance}m)</span>
      </div>
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 flex flex-col gap-1">
        {station.routes.length === 0 ? (
          <div className="text-xs text-gray-400 py-2 text-center">
            도착 정보 없음
          </div>
        ) : (
          station.routes.map((route, idx) => (
            <div
              key={`${route.routeId}-${route.destination}-${idx}`}
              className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-bold text-sm ${
                      route.routeType.includes("광역")
                        ? "text-red-500"
                        : route.routeType.includes("간선")
                          ? "text-blue-500"
                          : "text-green-500"
                    }`}
                  >
                    {route.routeName}
                  </span>
                  <span className="text-[10px] text-gray-500 bg-white px-1 py-0.5 rounded border border-gray-100">
                    {route.routeType}
                  </span>
                </div>
                <span className="text-xs text-gray-600 truncate max-w-[120px]">
                  {route.destination}행
                </span>
              </div>
              <div className="text-right">
                {route.mode === "realtime" ? (
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-bold text-red-600 text-xs">
                      {route.arrival1}
                    </span>
                    {route.arrival2 && (
                      <span className="text-[10px] text-gray-400">
                        다음: {route.arrival2}
                      </span>
                    )}
                    {route.congestion && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 h-4 bg-white"
                      >
                        {route.congestion}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-end text-[10px] text-gray-600">
                    <div>
                      첫차 {route.firstBus} · 막차 {route.lastBus}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="bg-white px-1 border border-gray-100 rounded text-gray-500">
                        배차 {route.interval}
                      </span>
                      <span
                        className={`font-semibold ${
                          route.operating ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {route.operating ? "운행 중" : "종료"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
