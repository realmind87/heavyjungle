import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { pingRedis } from "@/lib/cache";

export async function GET() {
  const checks = {
    postgres: false,
    redis: false,
  };
  const errors: { postgres?: string; redis?: string } = {};

  try {
    await db.execute(sql`select 1`);
    checks.postgres = true;
  } catch (error) {
    checks.postgres = false;
    errors.postgres = error instanceof Error ? error.message : "unknown error";
  }

  try {
    checks.redis = await pingRedis();
  } catch (error) {
    checks.redis = false;
    errors.redis = error instanceof Error ? error.message : "unknown error";
  }

  const healthy = checks.postgres && checks.redis;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks,
      ...(healthy ? {} : { errors }),
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
