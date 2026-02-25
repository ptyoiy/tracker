"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { Badge } from "@/shared/ui/badge";
import { Slider } from "@/shared/ui/slider";
import { useCctvSearch } from "../lib/useCctvSearch";
import {
  cctvLoadingAtom,
  cctvSearchCenterAtom,
  filteredCctvAtom,
  hoveredCctvIdAtom,
} from "../model/atoms";

export function CCTVSearchTab() {
  const cctvs = useAtomValue(filteredCctvAtom);
  const loading = useAtomValue(cctvLoadingAtom);
  const searchCenter = useAtomValue(cctvSearchCenterAtom);
  const setHoveredId = useSetAtom(hoveredCctvIdAtom);
  const { radius, setRadius } = useCctvSearch();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="radius-slider" className="text-sm font-medium">
            검색 반경
          </label>
          <Badge variant="secondary">{radius}m</Badge>
        </div>
        <Slider
          id="radius-slider"
          value={[radius]}
          min={50}
          max={1000}
          step={50}
          onValueChange={(vals) => setRadius(vals[0])}
        />
      </div>

      <div className="rounded-lg bg-blue-50 p-3 border border-blue-100 text-xs text-blue-800">
        {!searchCenter ? (
          <p>📍 지도의 특정 지점을 클릭하여 주변 CCTV를 검색하세요.</p>
        ) : (
          <p>✅ 선택된 지점 주변 {radius}m 내의 CCTV를 검색 중입니다.</p>
        )}
      </div>

      {loading && (
        <p className="text-xs text-gray-500 animate-pulse">
          CCTV 데이터를 불러오는 중...
        </p>
      )}

      {!loading && searchCenter && cctvs.length === 0 && (
        <p className="text-xs text-gray-500">검색된 CCTV가 없습니다.</p>
      )}

      <ul className="space-y-1 text-xs max-h-64 overflow-y-auto">
        {cctvs.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded border border-gray-200 px-2 py-2 text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
              onMouseEnter={() => setHoveredId(c.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">
                  {c.roadName ?? "주소 미상"}
                </span>
                <span className="text-gray-500">
                  {c.purpose} · {c.agency}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
