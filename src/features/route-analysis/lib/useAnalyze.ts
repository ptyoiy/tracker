"use client";

// biome-ignore assist/source/organizeImports: <bug>
import {
  futureMinutesAtom,
  observationsAtom,
} from "@/features/observation-input/model/atoms";
import {
  analyzeErrorAtom,
  analyzeLoadingAtom,
  segmentAnalysesAtom,
} from "@/features/route-analysis/model/atoms";
import type { AnalyzeRequest, AnalyzeResponse } from "@/types/analyze";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";

export function useAnalyze() {
  const observations = useAtomValue(observationsAtom);
  const futureMinutes = useAtomValue(futureMinutesAtom);
  const setSegments = useSetAtom(segmentAnalysesAtom);
  const setLoading = useSetAtom(analyzeLoadingAtom);
  const setError = useSetAtom(analyzeErrorAtom);

  const analyze = useCallback(async () => {
    if (observations.length < 2) {
      setError("관측 지점이 최소 2개 필요합니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: AnalyzeRequest = {
        observations,
        futureMinutes,
      };

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as AnalyzeResponse;

      if (!res.ok) {
        setError(data.errors ?? "분석에 실패했습니다.");
        setSegments(null);
        return;
      }

      setSegments(data.segments);
      if (data.fallbackUsed) {
        setError("TMAP 경로 대신 단순 추정 경로를 사용했습니다.");
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.",
      );
      setSegments(null);
    } finally {
      setLoading(false);
    }
  }, [observations, futureMinutes, setLoading, setError, setSegments]);

  return { analyze };
}
