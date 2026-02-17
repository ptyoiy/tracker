// src/shared/config/__tests__/env.test.ts
import { describe, expect, it } from "vitest";
import { env } from "../env";

describe("env", () => {
  it("필수 env가 파싱되어 있어야 한다", () => {
    expect(env.NEXT_PUBLIC_KAKAO_JS_KEY).toBeDefined();
    expect(env.KAKAO_REST_API_KEY).toBeDefined();
    expect(env.TMAP_APP_KEY).toBeDefined();
    expect(env.MAPBOX_ACCESS_TOKEN).toBeDefined();
    expect(env.DATA_GO_KR_API_KEY).toBeDefined();
  });
});
