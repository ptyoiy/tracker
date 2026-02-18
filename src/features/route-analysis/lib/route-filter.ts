import type { RouteInfo } from "@/types/analyze";

export type DurationToleranceConfig = {
  ratioTolerance: number; // 예: 0.3 (±30%)
};

const DEFAULT_TOLERANCE: DurationToleranceConfig = {
  ratioTolerance: 0.3,
};

export function filterByDurationTolerance(
  routes: RouteInfo[],
  observedDurationSeconds: number,
  config: DurationToleranceConfig = DEFAULT_TOLERANCE,
): RouteInfo[] {
  if (observedDurationSeconds <= 0) return routes;

  const min = observedDurationSeconds * (1 - config.ratioTolerance);
  const max = observedDurationSeconds * (1 + config.ratioTolerance);

  return routes.filter((r) => {
    const d = r.totalDurationSeconds;
    return d >= min && d <= max;
  });
}
