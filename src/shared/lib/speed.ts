// src/shared/lib/speed.ts
import { SPEED_THRESHOLD } from "@/shared/config/constant";

export type SpeedCategory = "walking" | "transit" | "vehicle";

export function calcSpeedKmh(
  distanceKm: number,
  durationSeconds: number,
): number {
  if (durationSeconds <= 0) return 0;
  return (distanceKm / durationSeconds) * 3600;
}

export function inferSpeedCategory(speedKmh: number): SpeedCategory {
  if (speedKmh <= SPEED_THRESHOLD.WALKING_MAX) return "walking";
  if (speedKmh <= SPEED_THRESHOLD.TRANSIT_MAX) return "transit";
  return "vehicle";
}
