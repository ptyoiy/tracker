"use client";

import { useIsochrone } from "../lib/useIsochrone";
import type { IsochroneProfile } from "../model/atoms";

const profiles: { value: IsochroneProfile; label: string }[] = [
  { value: "walking", label: "도보" },
  { value: "driving", label: "차량" },
  { value: "cycling", label: "자전거" },
];

export function IsochroneControls() {
  const { isochrone, computeIsochrone } = useIsochrone();

  const currentProfile = isochrone?.profile;

  const handleClickProfile = (profile: IsochroneProfile) => {
    void computeIsochrone(profile);
  };

  return (
    <div className="flex gap-2 items-center text-xs">
      {profiles.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => handleClickProfile(p.value)}
          className={`px-2 py-1 rounded border ${
            currentProfile === p.value
              ? "bg-black text-white border-black"
              : "bg-white text-gray-700 border-gray-300"
          }`}
        >
          {p.label}
        </button>
      ))}
      {isochrone?.fallbackUsed && (
        <span className="text-[11px] text-orange-500">
          Isochrone API 실패, 근사 원형 범위 사용 중
        </span>
      )}
    </div>
  );
}
