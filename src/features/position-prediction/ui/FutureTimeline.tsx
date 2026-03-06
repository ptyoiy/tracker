"use client";

import { Button } from "@/shared/ui/button";
import { Slider } from "@/shared/ui/slider";
import { useAtom, useAtomValue } from "jotai";
import { Clock, Pause, Play } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  futureMinutesAtom,
  isPlayingTimelineAtom,
  predictionResultAtom,
  predictionStateAtom,
} from "../model/prediction-atoms";

export function FutureTimeline() {
  const state = useAtomValue(predictionStateAtom);
  const result = useAtomValue(predictionResultAtom);
  const [futureMinutes, setFutureMinutes] = useAtom(futureMinutesAtom);
  const [isPlaying, setIsPlaying] = useAtom(isPlayingTimelineAtom);

  // 최대 예측 시간 (예: API에서 설정된 max 값 또는 현재 슬라이더의 최대 길이)
  const maxMinutes = result?.futureMinutes || 60; // 60분을 최대값으로 고정 또는 결과값 기준

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 재생 로직
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setFutureMinutes((prev) => {
          if (prev >= maxMinutes) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1; // 1분 단위로 이동
        });
      }, 500); // 0.5초마다 1분씩 증가
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, maxMinutes, setIsPlaying, setFutureMinutes]);

  // 예측 완료 상태가 아니면 숨김 처리
  if (state !== "predicted" || !result) {
    return null;
  }

  // 예측 완료 시점 (기준시각)
  const baseTime = new Date(result.timestamp);
  // 현재 슬라이더 시점
  const currentTime = new Date(baseTime.getTime() + futureMinutes * 60000);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="absolute bottom-[200px] left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-lg">
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 p-4 w-full flex flex-col gap-3 transition-all">
        {/* 상단 컨트롤 바 */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              기준: {formatTime(baseTime)}
            </span>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400">
              {formatTime(currentTime)}{" "}
              <span className="text-sm font-medium text-gray-500">
                (
                {futureMinutes > 0 ? `+${Math.round(futureMinutes)}분` : "현재"}
                )
              </span>
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm"
              onClick={() => {
                if (futureMinutes >= maxMinutes) {
                  setFutureMinutes(0); // 끝났으면 처음으로
                }
                setIsPlaying(!isPlaying);
              }}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-1" />
              )}
            </Button>
          </div>
        </div>

        {/* 슬라이더 제어 영역 */}
        <div className="px-2 pt-2">
          <Slider
            value={[futureMinutes]}
            min={0}
            max={maxMinutes}
            step={1}
            onValueChange={(val) => {
              if (isPlaying) setIsPlaying(false);
              setFutureMinutes(val[0]);
            }}
            className="py-2"
          />
          <div className="flex justify-between mt-1 px-1">
            <span className="text-[10px] text-gray-400 font-medium">현재</span>
            <span className="text-[10px] text-gray-400 font-medium">
              +{maxMinutes}분
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
