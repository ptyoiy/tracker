"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { Crosshair, MapPin, Search } from "lucide-react";
import { viewportAtom } from "@/features/map-view/model/atoms";
import { observationsAtom } from "@/features/observation-input/model/atoms";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
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
  const observations = useAtomValue(observationsAtom);
  const viewport = useAtomValue(viewportAtom);
  const { radius, setRadius, searchNearby, setSearchCenter } = useCctvSearch();

  const handleSearchAtCenter = () => {
    // 바텀 시트에 의해 가려진 영역을 제외한 비주얼 센터(시각적 중심) 기준 검색
    if (viewport?.visualCenter) {
      searchNearby(viewport.visualCenter.lat, viewport.visualCenter.lng);
    }
  };

  const handleClear = () => {
    setSearchCenter(null);
  };

  const radiusPresets = [100, 300, 500, 1000];

  return (
    <div className="space-y-6">
      {/* Search Actions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">검색 위치 지정</p>
          {searchCenter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 font-bold"
              onClick={handleClear}
            >
              위치 지정 해제
            </Button>
          )}
        </div>
        <Button
          className="w-full justify-start gap-2 h-10"
          variant="outline"
          onClick={handleSearchAtCenter}
          disabled={loading || !viewport}
        >
          <Crosshair className="w-4 h-4 text-blue-500" />
          <span className="flex-1 text-left">현재 지도 중심에서 검색</span>
        </Button>

        {observations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 px-1">관측 지점 주변 검색</p>
            <div className="flex flex-wrap gap-2">
              {observations.map((obs, idx) => (
                <Button
                  key={obs.id}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-9"
                  onClick={() => searchNearby(obs.lat, obs.lng)}
                  disabled={loading}
                >
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>#{idx + 1}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-gray-100" />

      {/* Radius Setting */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="radius-slider" className="text-sm font-semibold">
            검색 반경
          </label>
          <Badge variant="secondary" className="font-bold text-blue-600">
            {radius}m
          </Badge>
        </div>
        <Slider
          id="radius-slider"
          value={[radius]}
          min={50}
          max={1500}
          step={50}
          onValueChange={(vals) => setRadius(vals[0])}
        />
        <div className="flex gap-2">
          {radiusPresets.map((r) => (
            <Button
              key={r}
              variant={radius === r ? "default" : "outline"}
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => setRadius(r)}
            >
              {r}m
            </Button>
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <Search className="w-4 h-4 text-green-600" />
          검색 결과
          <span className="text-xs font-normal text-gray-500 ml-1">
            {cctvs.length}개 발견
          </span>
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500">CCTV 데이터를 불러오는 중...</p>
        </div>
      ) : cctvs.length > 0 ? (
        <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {cctvs.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-gray-100 p-3 text-left hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                onMouseEnter={() => setHoveredId(c.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-900 text-xs line-clamp-1 group-hover:text-blue-700">
                    {c.roadName || "주소 미상"}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                      {c.purpose}
                    </span>
                    <span>{c.agency}</span>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-xs text-gray-400">
            {searchCenter
              ? "검색된 CCTV가 없습니다."
              : "위치를 선택하여 검색을 시작하세요."}
          </p>
        </div>
      )}
    </div>
  );
}
