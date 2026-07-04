/**
 * Redis 세션 미러 — DB 검증 전 userId 조회 가속, fail-open.
 */
import "server-only";

import { logger } from "@/lib/logger";
import { redis } from "@/server/redis";

const SESSION_TOKEN_PREFIX = "session:t:";
const SESSION_USER_PREFIX = "session:u:";

export type SessionMirrorPayload = {
  userId: string;
  expiresAt: string;
};

async function ensureRedisConnected(): Promise<void> {
  if (redis.status === "wait" || redis.status === "end") {
    await redis.connect();
  }
}

function tokenKey(tokenHash: string): string {
  return `${SESSION_TOKEN_PREFIX}${tokenHash}`;
}

function userKey(userId: string): string {
  return `${SESSION_USER_PREFIX}${userId}`;
}

function ttlSecondsUntil(expiresAt: Date): number {
  return Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
}

export async function setSessionMirror(
  tokenHash: string,
  userId: string,
  expiresAt: Date,
): Promise<void> {
  try {
    await ensureRedisConnected();
    const ttl = ttlSecondsUntil(expiresAt);
    const payload: SessionMirrorPayload = {
      userId,
      expiresAt: expiresAt.toISOString(),
    };
    await redis.set(tokenKey(tokenHash), JSON.stringify(payload), "EX", ttl);
    await redis.sadd(userKey(userId), tokenHash);
    await redis.expire(userKey(userId), ttl);
  } catch (error) {
    logger.warn("session-cache: set failed", { error: String(error) });
  }
}

export async function getSessionMirror(tokenHash: string): Promise<SessionMirrorPayload | null> {
  try {
    await ensureRedisConnected();
    const raw = await redis.get(tokenKey(tokenHash));
    if (!raw) return null;

    const payload = JSON.parse(raw) as SessionMirrorPayload;
    if (new Date(payload.expiresAt).getTime() <= Date.now()) {
      await deleteSessionMirror(tokenHash, payload.userId);
      return null;
    }

    return payload;
  } catch (error) {
    logger.warn("session-cache: get failed", { error: String(error) });
    return null;
  }
}

export async function deleteSessionMirror(tokenHash: string, userId?: string): Promise<void> {
  try {
    await ensureRedisConnected();
    await redis.del(tokenKey(tokenHash));
    if (userId) {
      await redis.srem(userKey(userId), tokenHash);
    }
  } catch (error) {
    logger.warn("session-cache: delete failed", { error: String(error) });
  }
}

export async function deleteAllSessionMirrorsForUser(userId: string): Promise<void> {
  try {
    await ensureRedisConnected();
    const tokenHashes = await redis.smembers(userKey(userId));
    if (tokenHashes.length > 0) {
      await redis.del(...tokenHashes.map((hash) => tokenKey(hash)));
    }
    await redis.del(userKey(userId));
  } catch (error) {
    logger.warn("session-cache: deleteAll failed", { error: String(error) });
  }
}

export async function deleteOtherSessionMirrorsForUser(
  userId: string,
  keepTokenHash: string,
): Promise<void> {
  try {
    await ensureRedisConnected();
    const tokenHashes = await redis.smembers(userKey(userId));
    const toDelete = tokenHashes.filter((hash) => hash !== keepTokenHash);
    if (toDelete.length === 0) return;

    await redis.del(...toDelete.map((hash) => tokenKey(hash)));
    await redis.srem(userKey(userId), ...toDelete);
  } catch (error) {
    logger.warn("session-cache: deleteOther failed", { error: String(error) });
  }
}
