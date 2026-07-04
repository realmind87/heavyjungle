/**
 * Redis 연결 싱글톤.
 * ioredis 클라이언트를 제공합니다. (세션 미러·레이트 리미트)
 */
import "server-only";

import Redis from "ioredis";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const globalForRedis = globalThis as unknown as {
  redis?: Redis;
};

function createRedis(): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  client.on("error", (error) => {
    logger.error("redis: connection error", error);
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedis();

if (env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
