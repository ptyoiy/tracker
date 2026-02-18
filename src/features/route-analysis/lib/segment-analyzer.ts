import { getDistanceKm } from "@/shared/lib/geo/distance";
import { calcSpeedKmh, inferSpeedCategory } from "@/shared/lib/speed";
import { getDurationSeconds } from "@/shared/lib/time/duration";
import type { SegmentAnalysis } from "@/types/analyze";
import type { Observation } from "@/types/observation";

export function buildSegmentAnalyses(
  observations: Observation[],
): SegmentAnalysis[] {
  if (observations.length < 2) return [];

  const segments: SegmentAnalysis[] = [];

  for (let i = 0; i < observations.length - 1; i++) {
    const from = observations[i];
    const to = observations[i + 1];

    const distanceKm = getDistanceKm(from, to);
    const durationSeconds = getDurationSeconds(from.timestamp, to.timestamp);
    const averageSpeedKmh = calcSpeedKmh(distanceKm, durationSeconds);
    const inferredMode = inferSpeedCategory(averageSpeedKmh);

    segments.push({
      id: `${i}-${i + 1}`,
      fromIndex: i,
      toIndex: i + 1,
      from,
      to,
      distanceKm,
      durationSeconds,
      averageSpeedKmh,
      inferredMode,
      candidateRoutes: [],
    });
  }

  return segments;
}
