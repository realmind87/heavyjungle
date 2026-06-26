/**
 * PostgreSQL 연결 싱글톤.
 * postgres-js 드라이버와 Drizzle 인스턴스를 제공합니다. (스키마 바인딩은 이후 단계)
 */
import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

const POOL_MAX = 20;
const IDLE_TIMEOUT_SECONDS = 20;
const CONNECT_TIMEOUT_SECONDS = 10;

const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
};

function createSql() {
  return postgres(env.DATABASE_URL, {
    max: POOL_MAX,
    idle_timeout: IDLE_TIMEOUT_SECONDS,
    connect_timeout: CONNECT_TIMEOUT_SECONDS,
    prepare: true,
  });
}

export const sql = globalForDb.sql ?? createSql();

if (env.NODE_ENV !== "production") {
  globalForDb.sql = sql;
}

export const db = drizzle(sql, { schema, logger: env.NODE_ENV === "development" });

export { schema };
