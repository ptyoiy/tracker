"use client";

import { useAtomValue } from "jotai";
import {
  analyzeErrorAtom,
  analyzeLoadingAtom,
  segmentAnalysesAtom,
} from "../model/atoms";
import { RouteCard } from "./routeCard";

export function RouteAnalysisPanel() {
  const segments = useAtomValue(segmentAnalysesAtom);
  const loading = useAtomValue(analyzeLoadingAtom);
  const error = useAtomValue(analyzeErrorAtom);

  if (loading) {
    return <div className="text-sm text-gray-600">경로 분석 중…</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  if (!segments || segments.length === 0) {
    return (
      <div className="text-sm text-gray-500">아직 분석된 경로가 없습니다.</div>
    );
  }

  return (
    <div className="space-y-2">
      {segments.map((s) => (
        <RouteCard key={s.id} segment={s} />
      ))}
    </div>
  );
}
