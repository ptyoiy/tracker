import { useQuery } from "@tanstack/react-query";
import { analyzeQueries } from "@/shared/api/queries";
import type { Observation } from "@/types/observation";

export function useAnalyzeQuery(
  observations: Observation[] | undefined,
  futureMinutes: number | undefined,
) {
  const opts = analyzeQueries.segments(observations, futureMinutes);
  return useQuery(opts); // enabled 조건, staleTime 등 이미 포함
}
