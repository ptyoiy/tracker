"use client";

import { format } from "date-fns";
import { useAtomValue } from "jotai";
import { Info } from "lucide-react";
import { observationsAtom } from "@/features/observation-input/model/atoms";
import { Slider } from "@/shared/ui/slider";
import { useIsochrone } from "../lib/useIsochrone";
import type { IsochroneProfile } from "../model/atoms";

const profiles: { value: IsochroneProfile; label: string }[] = [
  { value: "walking", label: "도보" },
  { value: "driving", label: "차량" },
  { value: "cycling", label: "자전거" },
];

export function IsochroneControls() {
  const { isochrone, computeIsochrone, futureMinutes, setFutureMinutes } =
    useIsochrone();
  const observations = useAtomValue(observationsAtom);

  const currentProfile = isochrone?.profile ?? "walking";
  const currentIndex =
    isochrone?.observationIndex ??
    (observations.length > 0 ? observations.length - 1 : undefined);
  const selectedObservation =
    currentIndex !== undefined ? observations[currentIndex] : null;

  const handleClickProfile = (profile: IsochroneProfile) => {
    void computeIsochrone(profile);
  };

  const handleClickPoint = (index: number) => {
    void computeIsochrone(currentProfile, index);
  };

  const handleSliderChange = (value: number[]) => {
    if (value[0]) {
      setFutureMinutes(value[0]);
    }
  };

  // 슬라이더 조작이 끝났을 때만 API 호출 (디바운싱 효과)
  const handleSliderCommit = (value: number[]) => {
    if (value[0] && isochrone) {
      void computeIsochrone(currentProfile, currentIndex);
    }
  };

  if (observations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-center px-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        <Info className="w-10 h-10 mb-3 opacity-20" />
        <p className="text-[14px] font-bold text-gray-400">
          표시할 수 있는 지점이 없습니다.
        </p>
        <p className="text-[11px] mt-1 leading-relaxed">
          먼저 관측 지점을 1개 이상 등록해주세요.
          <br />
          선택한 지점으로부터의 이동 가능 범위를 분석합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2 bg-white/80 backdrop-blur-sm rounded-lg border shadow-sm w-full">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold text-gray-500 ml-1">
          지점 선택
        </span>
        <div className="flex gap-1 flex-wrap">
          {observations.map((obs, idx) => (
            <button
              key={obs.id}
              type="button"
              onClick={() => handleClickPoint(idx)}
              className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-medium border transition-colors ${
                currentIndex === idx
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
        {selectedObservation && (
          <div className="mt-1 px-1 flex items-center gap-1 text-[11px] text-gray-600 leading-tight">
            <span className="shrink-0 font-medium">
              {format(new Date(selectedObservation.timestamp), "HH:mm")}
            </span>
            <span className="shrink-0 text-gray-400">|</span>
            <span className="truncate" title={selectedObservation.address}>
              {selectedObservation.address}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 border-t pt-2">
        <div className="flex justify-between items-center pr-1">
          <span className="text-[10px] font-semibold text-gray-500 ml-1">
            추정 대상 시간
          </span>
          <span className="text-[10px] font-bold text-blue-600">
            {futureMinutes}분 후
          </span>
        </div>
        <div className="px-1 py-2">
          <Slider
            value={[futureMinutes]}
            min={1}
            max={60}
            step={1}
            onValueChange={handleSliderChange}
            onValueCommit={handleSliderCommit}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 border-t pt-2">
        <span className="text-[10px] font-semibold text-gray-500 ml-1">
          이동 수단
        </span>
        <div className="flex gap-1">
          {profiles.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => handleClickProfile(p.value)}
              className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                currentProfile === p.value
                  ? "bg-black text-white border-black shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isochrone?.fallbackUsed && (
        <span className="text-[10px] text-orange-500 mt-1 leading-tight">
          ⚠️ 등시선 API 실패, 근사 범위 표시 중
        </span>
      )}
    </div>
  );
}
