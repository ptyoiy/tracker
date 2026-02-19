// src/features/route-analysis/ui/RouteListPanel.tsx
"use client";

import { useAtomValue } from "jotai";
import {
  analyzeErrorAtom,
  analyzeLoadingAtom,
  segmentAnalysesAtom,
} from "../model/atoms";
import { RouteCard } from "./RouteCard";

export function RouteListPanel() {
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

  const allRoutes = segments.flatMap((s) => s.candidateRoutes ?? []);

  if (!allRoutes.length) {
    return (
      <div className="text-sm text-gray-500">
        분석 결과에서 사용 가능한 경로 후보가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {allRoutes.map((route) => (
        <RouteCard key={route.id} route={route} />
      ))}
    </div>
  );
}
