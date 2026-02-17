import type { ApiError } from "@/types/common";

export function toApiError(error: unknown, fallbackCode = "UNKNOWN"): ApiError {
  // TODO: ky error, network error 등 분기 처리
  return {
    code: fallbackCode,
    message: error instanceof Error ? error.message : "Unknown error",
  };
}
