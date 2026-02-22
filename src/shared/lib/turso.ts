// src/lib/turso.ts
import { createClient } from "@libsql/client";
import { env } from "../config/env";

export const turso = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});
