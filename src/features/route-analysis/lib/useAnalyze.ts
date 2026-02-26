// src/features/route-analysis/lib/useAnalyze.ts
"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { computeObservationsHash } from "@/features/observation-input/lib/observation-hash";
import {
  futureMinutesAtom,
  observationsAtom,
} from "@/features/observation-input/model/atoms";
import {
  analysisResultAtom,
  analyzeErrorAtom,
  analyzeLoadingAtom,
  selectedRouteIdsAtom,
} from "../model/atoms";

export function useAnalyze() {
  const observations = useAtomValue(observationsAtom);
  const futureMinutes = useAtomValue(futureMinutesAtom);
  const setAnalysisResult = useSetAtom(analysisResultAtom);
  const setLoading = useSetAtom(analyzeLoadingAtom);
  const setError = useSetAtom(analyzeErrorAtom);
  const setSelectedIds = useSetAtom(selectedRouteIdsAtom);

  const analyze = async () => {
    if (observations.length < 2) return;

    const currentHash = computeObservationsHash(observations);

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observations, futureMinutes }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.errors ?? "경로 분석에 실패했습니다.");
        setAnalysisResult((prev) => ({
          ...prev,
          segments: null,
          observationsHash: null,
          stale: false,
        }));
        setSelectedIds(new Set());
        return;
      }

      setAnalysisResult({
        segments: data.segments ?? [],
        observationsHash: currentHash,
        stale: false,
      });

      // 기본 선택: 각 세그먼트의 최단 소요시간 경로 1개씩, 최대 3개
      const initialSelected = new Set<string>();
      for (const seg of data.segments ?? []) {
        const routes = seg.candidateRoutes ?? [];
        if (!routes.length) continue;
        const best = [...routes].sort(
          (a, b) => a.totalDurationSeconds - b.totalDurationSeconds,
        )[0];
        if (best && initialSelected.size < 3) {
          initialSelected.add(best.id);
        }
      }
      setSelectedIds(initialSelected);
    } catch (e) {
      console.error(e);
      setError("경로 분석 중 오류가 발생했습니다.");
      setAnalysisResult((prev) => ({
        ...prev,
        segments: null,
        observationsHash: null,
        stale: false,
      }));
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  return { analyze };
}
