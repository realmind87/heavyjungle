/**
 * 스키마 바인딩 Drizzle 클라이언트 (레거시 items 데모용).
 * 연결 싱글톤은 @/server/db 에서 관리합니다.
 */
import "server-only";

import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { type PostgresJsDatabase, type PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";

export { db };
export * from "@/server/db/schema";

export type DbClient = PostgresJsDatabase<typeof schema>;
export type DbTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export async function withTransaction<T>(fn: (tx: DbTransaction) => Promise<T>): Promise<T> {
  return db.transaction(fn);
}
