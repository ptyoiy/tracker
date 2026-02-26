"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/client";
import { analyzeQueries } from "@/shared/api/queries";
import type { AnalyzeRequest, AnalyzeResponse } from "@/types/analyze";

export function useAnalyzeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: AnalyzeRequest) =>
      apiClient.post("analyze", { json: req }).json<AnalyzeResponse>(),
    onSuccess: (data, variables) => {
      // 해당 관측 세트에 대한 쿼리 캐시를 직접 설정
      const opts = analyzeQueries.segments(
        variables.observations,
        variables.futureMinutes,
      );
      queryClient.setQueryData(opts.queryKey, data);
    },
  });
}
