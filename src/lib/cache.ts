/**
 * Redis 캐시 헬퍼 (레거시 items 데모용).
 * 연결 싱글톤은 @/server/redis 에서 관리합니다.
 */
import "server-only";

import { redis } from "@/server/redis";

const DEFAULT_CACHE_TTL_SECONDS = 300;

async function ensureRedisConnected(): Promise<void> {
  if (redis.status === "wait" || redis.status === "end") {
    await redis.connect();
  }
}

export async function pingRedis(): Promise<boolean> {
  await ensureRedisConnected();
  return (await redis.ping()) === "PONG";
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  await ensureRedisConnected();
  const raw = await redis.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  await ensureRedisConnected();
  const ttl = ttlSeconds ?? DEFAULT_CACHE_TTL_SECONDS;
  await redis.set(key, JSON.stringify(value), "EX", ttl);
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await ensureRedisConnected();
  await redis.del(...keys);
}

export function cacheKey(namespace: string, ...parts: (string | number)[]): string {
  return `${namespace}:${parts.join(":")}`;
}
