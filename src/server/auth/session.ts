/**
 * 세션 생성·검증·삭제.
 * DB에 tokenHash 저장, 원본 토큰은 쿠키에만 둡니다.
 */
import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/server/db";
import { sessions, users } from "@/server/db/schema";
import type { User } from "@/server/db/schema/users";
import { SESSION_MAX_AGE_SECONDS } from "./cookies";

const TOKEN_BYTE_LENGTH = 32;

/** 만료 7일 전이면 sliding renewal */
const SLIDING_RENEWAL_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateSessionToken(): string {
  return randomBytes(TOKEN_BYTE_LENGTH).toString("base64url");
}

function sessionExpiresAt(): Date {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);

  await db.insert(sessions).values({
    tokenHash,
    userId,
    expiresAt: sessionExpiresAt(),
  });

  // TODO(cache): Redis에 session:{tokenHash} → userId 미러 (선택)

  return token;
}

type ValidatedSession = {
  user: User;
  token: string;
};

export async function validateSession(token: string): Promise<ValidatedSession | null> {
  const tokenHash = hashSessionToken(token);

  const [row] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);

  if (!row) return null;

  if (row.expiresAt.getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, row.sessionId));
    return null;
  }

  const remainingMs = row.expiresAt.getTime() - Date.now();
  if (remainingMs < SLIDING_RENEWAL_THRESHOLD_MS) {
    await db
      .update(sessions)
      .set({ expiresAt: sessionExpiresAt() })
      .where(eq(sessions.id, row.sessionId));
  }

  return { user: row.user, token };
}

export async function deleteSession(token: string): Promise<void> {
  const tokenHash = hashSessionToken(token);
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  // TODO(cache): Redis session 미러 삭제
}

/** 비밀번호 변경 등 — 현재 세션을 제외한 다른 기기 세션 무효화 */
export async function deleteOtherSessions(userId: string, currentToken: string): Promise<void> {
  const currentTokenHash = hashSessionToken(currentToken);
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), ne(sessions.tokenHash, currentTokenHash)));
}

/** 비밀번호 재설정 등 — 해당 사용자의 모든 세션 무효화 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
