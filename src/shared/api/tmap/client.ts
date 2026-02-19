// src/shared/api/tmap/client.ts

import ky from "ky";
import { env } from "@/shared/config/env";

export const tmapClient = ky.create({
  prefixUrl: "https://apis.openapi.sk.com",
  headers: {
    appKey: env.TMAP_APP_KEY,
    "Content-Type": "application/json",
  },
  timeout: 10_000,
  retry: 2,
});
