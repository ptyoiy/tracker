import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1분간 fresh
        gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
        retry: 1,
        refetchOnWindowFocus: false, // 현장 사용 시 탭 전환 refetch 방지
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
