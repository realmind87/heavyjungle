/**
 * Redis 연결 싱글톤.
 * ioredis 클라이언트를 제공합니다. (캐시/세션 로직은 이후 단계)
 */
import "server-only";

import Redis from "ioredis";
import { env } from "@/lib/env";

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
    console.error("[redis] connection error:", error);
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedis();

if (env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
