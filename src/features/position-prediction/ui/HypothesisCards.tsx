"use client";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import type { TransportMode } from "@/types/prediction";
import { useAtomValue, useSetAtom } from "jotai";
import { Car, Footprints, Loader2, Train } from "lucide-react";
import { usePredictPosition } from "../lib/usePredictPosition";
import {
  predictionResultAtom,
  selectedHypothesisIdAtom,
} from "../model/prediction-atoms";

function ModeIcon({
  mode,
  className,
}: {
  mode: TransportMode;
  className?: string;
}) {
  switch (mode) {
    case "walking":
      return <Footprints className={className} />;
    case "vehicle":
      return <Car className={className} />;
    case "transit":
      return <Train className={className} />;
  }
}

function ModeLabel(mode: TransportMode) {
  switch (mode) {
    case "walking":
      return "도보";
    case "vehicle":
      return "차량";
    case "transit":
      return "대중교통";
  }
}

export function HypothesisCards() {
  const result = useAtomValue(predictionResultAtom);
  const selectedId = useAtomValue(selectedHypothesisIdAtom);
  const setSelectedId = useSetAtom(selectedHypothesisIdAtom);
  const { predict, state, observationsCount } = usePredictPosition();

  if (
    state === "idle" ||
    state === "predicting" ||
    state === "error" ||
    (!result && state !== "predicted")
  ) {
    return (
      <div className="flex flex-col gap-4 p-5 text-center items-center justify-center min-h-[160px] bg-white border-b border-gray-100 dark:bg-zinc-950 dark:border-zinc-800">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          관측 지점 이동 기록을 바탕으로 향후 실시간 이동 경로와 목적지를
          예측합니다.
          <br />
          <span className="text-xs text-gray-400 mt-1 block">
            현재 등록된 관측 지점: {observationsCount}개 (최소 2개 이상 필요)
          </span>
        </div>

        <Button
          onClick={() => predict(60)}
          disabled={state === "predicting" || observationsCount < 2}
          className="w-full max-w-[280px]"
        >
          {state === "predicting" ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              예측 데이터 분석 중...
            </>
          ) : observationsCount < 2 ? (
            "관측 지점이 부족합니다"
          ) : (
            "실시간 위치 예측 실행"
          )}
        </Button>

        {state === "error" && (
          <div className="text-xs text-red-500 font-medium">
            예측 분석 중 오류가 발생했습니다. 재시도 해주세요.
          </div>
        )}
      </div>
    );
  }

  if (!result || result.status !== "success") return null;

  return (
    <div className="flex flex-col gap-3 p-4 bg-white border-b border-gray-100 dark:bg-zinc-950 dark:border-zinc-800">
      <h3 className="font-semibold text-sm mb-1 text-gray-800 dark:text-gray-200">
        예측 경로 시나리오
      </h3>

      <div className="flex flex-col gap-2 relative">
        {result.hypotheses.map((hyp) => {
          const isSelected = selectedId === hyp.id;
          const probPercent = Math.round(hyp.probability * 100);

          return (
            <Card
              key={hyp.id}
              className={`cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-zinc-900 ${
                isSelected
                  ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-900/10"
                  : ""
              }`}
              onClick={() => setSelectedId(isSelected ? null : hyp.id)}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      hyp.mode === "walking"
                        ? "bg-blue-100 text-blue-600"
                        : hyp.mode === "transit"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    <ModeIcon mode={hyp.mode} className="w-4 h-4" />
                  </div>

                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">
                      {ModeLabel(hyp.mode)}
                      {hyp.transitDetails?.lineName &&
                        ` (${hyp.transitDetails.lineName})`}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      평균 {Math.round(hyp.metadata.avgSpeed)}km/h 이동
                    </span>
                    {hyp.estimatedDestination && (
                      <span className="text-xs text-muted-foreground">
                        예상 목적지:{" "}
                        {hyp.estimatedDestination.name || "알 수 없음"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={probPercent >= 50 ? "default" : "secondary"}
                    className={
                      probPercent >= 50 ? "bg-blue-600 hover:bg-blue-700" : ""
                    }
                  >
                    {probPercent}% 신뢰도
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedId && (
        <button
          type="button"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline self-end mt-1"
          onClick={() => setSelectedId(null)}
        >
          필터 해제 (전체 보기)
        </button>
      )}
    </div>
  );
}
