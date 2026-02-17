// src/config/env.ts
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_KAKAO_JS_KEY: z.string().min(1),
  KAKAO_REST_API_KEY: z.string().min(1),
  TMAP_APP_KEY: z.string().min(1),
  MAPBOX_ACCESS_TOKEN: z.string().min(1),
  DATA_GO_KR_API_KEY: z.string().min(1),
  // CCTV_API_KEY: z.string().min(1),
  // NEXTPUBLIC_VERCEL_ANALYTICS_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // 초기 단계라면 바로 throw해서 빠르게 깨지게
  // TODO: 나중에 로깅 추가 가능
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(parsed.error.format())}`,
  );
}

export const env = parsed.data;
