// src/shared/lib/speed.ts
export type SpeedCategory = "walking" | "transit" | "vehicle";

export function calcSpeedKmh(
  distanceKm: number,
  durationSeconds: number,
): number {
  if (durationSeconds <= 0) return 0;
  return (distanceKm / durationSeconds) * 3600;
}

export function inferSpeedCategory(speedKmh: number): SpeedCategory {
  // TODO: constants에서 threshold import해서 사용
  return "walking";
}
