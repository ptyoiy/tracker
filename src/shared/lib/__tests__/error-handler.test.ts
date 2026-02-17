// src/shared/lib/__tests__/error-handler.test.ts
import { describe, expect, it } from "vitest";
import { toApiError } from "../error-handler";

describe("toApiError", () => {
  it("Error 인스턴스를 ApiError로 변환한다", () => {
    const err = new Error("boom");
    const apiErr = toApiError(err, "TEST");
    expect(apiErr.code).toBe("TEST");
    expect(apiErr.message).toBe("boom");
  });

  it("알 수 없는 값도 안전하게 처리한다", () => {
    const apiErr = toApiError("oops", "TEST");
    expect(apiErr.code).toBe("TEST");
    expect(apiErr.message).toBe("Unknown error");
  });
});
