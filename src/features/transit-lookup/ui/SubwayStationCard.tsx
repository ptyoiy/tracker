// src/features/transit-lookup/ui/SubwayStationCard.tsx
import type { SubwayStationResult } from "../model/types";

export function SubwayStationCard({
  station,
}: {
  station: SubwayStationResult;
}) {
  const lines = Array.from(new Set(station.lines.map((l) => l.lineName))).join(
    " / ",
  );

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-900 text-sm">
          {station.stationName}역
        </span>
        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
          {station.distance}m
        </span>
        <span className="text-xs font-medium text-orange-600">{lines}</span>
      </div>
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 flex flex-col gap-1">
        {station.lines.length === 0 ? (
          <div className="text-xs text-gray-400 py-2 text-center">
            도착 정보 없음
          </div>
        ) : (
          station.lines.map((line, idx) => (
            <div
              key={`${line.lineName}-${line.direction}-${idx}`}
              className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-orange-500 text-sm">
                  {line.lineName}
                </span>
                <span className="text-xs text-gray-600">{line.direction}</span>
              </div>
              <div className="text-right">
                {line.mode === "realtime" ? (
                  <span className="font-bold text-red-600 text-xs">
                    {line.arrival}
                  </span>
                ) : (
                  <div className="flex flex-col gap-1 text-[11px] text-gray-600">
                    {line.trains.slice(0, 3).map((t, tidx) => (
                      <div
                        key={`${t.trainNo}-${tidx}`}
                        className="flex justify-end gap-2 items-center"
                      >
                        <span className="text-gray-400 font-mono">
                          {t.departureTime}
                        </span>
                        {t.isExpress && (
                          <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded font-bold">
                            급행
                          </span>
                        )}
                        <span
                          className={`font-semibold ${
                            t.minutesFromRef > 0
                              ? "text-blue-600"
                              : "text-gray-400"
                          }`}
                        >
                          {t.minutesFromRef > 0
                            ? `${t.minutesFromRef}분 후`
                            : `${Math.abs(t.minutesFromRef)}분 전`}
                        </span>
                      </div>
                    ))}
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
