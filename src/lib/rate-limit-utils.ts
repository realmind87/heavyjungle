import { createHash } from "node:crypto";

/** 식별자 해시 — 이메일·아이디를 Redis 키에 그대로 넣지 않음 */
export function hashRateLimitId(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 32);
}

export function rateLimitErrorMessage(retryAfterSeconds: number): string {
  if (retryAfterSeconds >= 60) {
    const minutes = Math.ceil(retryAfterSeconds / 60);
    return `요청이 너무 많습니다. ${minutes}분 후 다시 시도해 주세요.`;
  }
  return `요청이 너무 많습니다. ${retryAfterSeconds}초 후 다시 시도해 주세요.`;
}
