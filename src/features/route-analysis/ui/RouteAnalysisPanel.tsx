// src/features/route-analysis/ui/RouteListPanel.tsx
"use client";

import { useAtomValue } from "jotai";
import {
  analyzeErrorAtom,
  analyzeLoadingAtom,
  segmentAnalysesAtom,
  selectedRouteInfosAtom,
} from "../model/atoms";
import { RouteCard } from "./RouteCard";

export function RouteListPanel() {
  const segments = useAtomValue(segmentAnalysesAtom);
  const loading = useAtomValue(analyzeLoadingAtom);
  const error = useAtomValue(analyzeErrorAtom);
  const _selectedRoutes = useAtomValue(selectedRouteInfosAtom);

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

  // 선택된 경로들의 총 거리와 소요 시간 계산
  // const totalDistance = selectedRoutes.reduce((acc, r) => acc + r.totalDistanceKm, 0);
  // const totalDurationSeconds = selectedRoutes.reduce((acc, r) => acc + r.totalDurationSeconds, 0);
  // const totalDurationMinutes = Math.round(totalDurationSeconds / 60);

  return (
    <div className="space-y-4">
      {/* <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
        <h3 className="text-sm font-bold text-blue-900 mb-1">선택된 경로 합계</h3>
        <div className="flex gap-4 text-sm text-blue-700 font-medium">
          <span>총 {totalDistance.toFixed(1)} km</span>
          <span>총 {totalDurationMinutes}분</span>
        </div>
      </div> */}

      <div className="space-y-2">
        {allRoutes.map((route) => (
          <RouteCard key={route.id} route={route} />
        ))}
      </div>
    </div>
  );
}
