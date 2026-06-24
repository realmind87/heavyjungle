import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { pingRedis } from "@/lib/cache";

export async function GET() {
  const checks = {
    postgres: false,
    redis: false,
  };

  try {
    await db.execute(sql`select 1`);
    checks.postgres = true;
  } catch {
    checks.postgres = false;
  }

  try {
    checks.redis = await pingRedis();
  } catch {
    checks.redis = false;
  }

  const healthy = checks.postgres && checks.redis;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
