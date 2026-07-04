/**
 * Redis 고정 윈도우 레이트 리미팅.
 * Redis 장애 시 fail-open (요청 허용) — 가용성 우선.
 */
import "server-only";

import { headers } from "next/headers";
import { hashRateLimitId, rateLimitErrorMessage } from "@/lib/rate-limit-utils";
import { logger } from "@/lib/logger";
import { redis } from "@/server/redis";

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

export { hashRateLimitId, rateLimitErrorMessage };

async function ensureRedisConnected(): Promise<void> {
  if (redis.status === "wait" || redis.status === "end") {
    await redis.connect();
  }
}

export async function getClientIp(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return headerStore.get("x-real-ip")?.trim() || "unknown";
}

/**
 * 고정 윈도우 카운터.
 * limit 초과 시 ok:false, 윈도우 만료까지 retryAfterSeconds.
 */
export async function checkRateLimit(options: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = options;
  const redisKey = `rl:${key}`;

  try {
    await ensureRedisConnected();
    const count = await redis.incr(redisKey);

    if (count === 1) {
      await redis.expire(redisKey, windowSeconds);
    }

    if (count > limit) {
      const ttl = await redis.ttl(redisKey);
      return {
        ok: false,
        retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
      };
    }

    return { ok: true };
  } catch (error) {
    logger.error("rate-limit: Redis unavailable, allowing request (fail-open)", error, {
      key,
    });
    return { ok: true };
  }
}

/** 여러 키를 순서대로 검사 — 하나라도 초과하면 실패 */
export async function checkRateLimits(
  checks: Array<{ key: string; limit: number; windowSeconds: number }>,
): Promise<RateLimitResult> {
  for (const check of checks) {
    const result = await checkRateLimit(check);
    if (!result.ok) return result;
  }
  return { ok: true };
}
