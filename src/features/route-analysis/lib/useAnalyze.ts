// src/features/route-analysis/lib/useAnalyze.ts
"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  futureMinutesAtom,
  observationsAtom,
} from "@/features/observation-input/model/atoms";
import {
  analyzeErrorAtom,
  analyzeLoadingAtom,
  segmentAnalysesAtom,
  selectedRouteIdsAtom,
} from "../model/atoms";

export function useAnalyze() {
  const observations = useAtomValue(observationsAtom);
  const futureMinutes = useAtomValue(futureMinutesAtom);
  const setSegments = useSetAtom(segmentAnalysesAtom);
  const setLoading = useSetAtom(analyzeLoadingAtom);
  const setError = useSetAtom(analyzeErrorAtom);
  const setSelectedIds = useSetAtom(selectedRouteIdsAtom);

  const analyze = async () => {
    if (observations.length < 2) return;

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
        setSegments(null);
        setSelectedIds(new Set());
        return;
      }
      console.log({ data }, { depth: null });
      setSegments(data.segments ?? []);

      // 기본 선택: 각 세그먼트의 최단 소요시간 경로 1개씩, 최대 3개
      const initialSelected = new Set<string>();
      for (const seg of data.segments ?? []) {
        const routes = seg.candidateRoutes ?? [];
        if (!routes.length) continue;
        const best = [...routes].sort(
          (a, b) => a.estimatedDurationSeconds - b.estimatedDurationSeconds,
        )[0];
        if (best && initialSelected.size < 3) {
          initialSelected.add(best.id);
        }
      }
      setSelectedIds(initialSelected);
    } catch (e) {
      console.error(e);
      setError("경로 분석 중 오류가 발생했습니다.");
      setSegments(null);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  return { analyze };
}
