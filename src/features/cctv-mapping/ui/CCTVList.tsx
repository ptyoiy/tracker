// src/features/cctv-mapping/ui/CCTVList.tsx
"use client";

import { useAtom } from "jotai";
import { useFilteredCctv } from "../lib/useFilteredCctv";
import { hoveredCctvIdAtom } from "../model/atoms";

export function CCTVList() {
  const cctvs = useFilteredCctv();
  const [hoveredId, setHoveredId] = useAtom(hoveredCctvIdAtom);

  if (!cctvs.length) {
    return (
      <p className="text-xs text-gray-500" aria-live="polite">
        현재 선택된 경로 주변에 표시할 CCTV가 없습니다.
      </p>
    );
  }

  return (
    <section aria-label="경로 주변 CCTV 목록">
      <ul className="space-y-1 text-xs max-h-48 overflow-y-auto">
        {cctvs.map((c) => {
          const isActive = hoveredId === c.id;

          return (
            <li key={c.id}>
              <button
                type="button"
                className={`flex w-full items-center justify-between rounded border px-2 py-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                  isActive ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
                aria-pressed={isActive}
                onMouseEnter={() => setHoveredId(c.id)}
                onMouseLeave={() =>
                  setHoveredId((prev) => (prev === c.id ? null : prev))
                }
                onClick={() => setHoveredId(c.id)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{c.roadName ?? c.id}</span>
                  <span className="text-gray-500">
                    {c.agency ?? "관제 주체 미상"} · {c.direction}
                  </span>
                </div>
                <span className="text-gray-400">
                  {c.lat.toFixed(5)}, {c.lng.toFixed(5)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
