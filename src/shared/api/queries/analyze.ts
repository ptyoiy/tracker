import { queryOptions } from "@tanstack/react-query";
import type { AnalyzeResponse } from "@/types/analyze";
import type { Observation } from "@/types/observation";
import { apiClient } from "../client";

export const analyzeQueries = {
  all: () => ["analyze"] as const,

  segments: (
    observations: Observation[] | undefined,
    futureMinutes: number | undefined,
  ) =>
    queryOptions({
      queryKey: [
        ...analyzeQueries.all(),
        "segments",
        { observations, futureMinutes },
      ] as const,
      queryFn: () =>
        apiClient
          .post("analyze", { json: { observations, futureMinutes } })
          .json<AnalyzeResponse>(),
      staleTime: Number.POSITIVE_INFINITY,
      enabled:
        !!observations &&
        observations.length >= 2 &&
        futureMinutes !== undefined,
    }),
};
