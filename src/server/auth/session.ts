/**
 * 세션 생성·검증·삭제.
 * DB에 tokenHash 저장, Redis에 userId 미러 (fail-open).
 */
import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import {
  deleteAllSessionMirrorsForUser,
  deleteOtherSessionMirrorsForUser,
  deleteSessionMirror,
  getSessionMirror,
  setSessionMirror,
} from "@/server/auth/session-cache";
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
  const expiresAt = sessionExpiresAt();

  await db.insert(sessions).values({
    tokenHash,
    userId,
    expiresAt,
  });

  await setSessionMirror(tokenHash, userId, expiresAt);

  return token;
}

type ValidatedSession = {
  user: User;
  token: string;
};

async function loadUserById(userId: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ?? null;
}

async function renewSessionIfNeeded(sessionId: string, expiresAt: Date): Promise<Date> {
  const remainingMs = expiresAt.getTime() - Date.now();
  if (remainingMs >= SLIDING_RENEWAL_THRESHOLD_MS) {
    return expiresAt;
  }

  const nextExpiresAt = sessionExpiresAt();
  await db.update(sessions).set({ expiresAt: nextExpiresAt }).where(eq(sessions.id, sessionId));
  return nextExpiresAt;
}

async function validateFromSessionRow(
  token: string,
  tokenHash: string,
  sessionRow: { sessionId: string; expiresAt: Date; userId: string },
): Promise<ValidatedSession | null> {
  if (sessionRow.expiresAt.getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, sessionRow.sessionId));
    await deleteSessionMirror(tokenHash, sessionRow.userId);
    return null;
  }

  const user = await loadUserById(sessionRow.userId);
  if (!user) {
    await deleteSessionMirror(tokenHash, sessionRow.userId);
    return null;
  }

  const nextExpiresAt = await renewSessionIfNeeded(sessionRow.sessionId, sessionRow.expiresAt);
  await setSessionMirror(tokenHash, user.id, nextExpiresAt);

  return { user, token };
}

export async function validateSession(token: string): Promise<ValidatedSession | null> {
  const tokenHash = hashSessionToken(token);
  const mirror = await getSessionMirror(tokenHash);

  if (mirror) {
    const [sessionRow] = await db
      .select({
        sessionId: sessions.id,
        expiresAt: sessions.expiresAt,
        userId: sessions.userId,
      })
      .from(sessions)
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1);

    if (!sessionRow || sessionRow.userId !== mirror.userId) {
      if (mirror) await deleteSessionMirror(tokenHash, mirror.userId);
      return null;
    }

    return validateFromSessionRow(token, tokenHash, sessionRow);
  }

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
    await deleteSessionMirror(tokenHash, row.user.id);
    return null;
  }

  const nextExpiresAt = await renewSessionIfNeeded(row.sessionId, row.expiresAt);
  await setSessionMirror(tokenHash, row.user.id, nextExpiresAt);
  return { user: row.user, token };
}

export async function deleteSession(token: string): Promise<void> {
  const tokenHash = hashSessionToken(token);
  const mirror = await getSessionMirror(tokenHash);
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  await deleteSessionMirror(tokenHash, mirror?.userId);
}

/** 비밀번호 변경 등 — 현재 세션을 제외한 다른 기기 세션 무효화 */
export async function deleteOtherSessions(userId: string, currentToken: string): Promise<void> {
  const currentTokenHash = hashSessionToken(currentToken);
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), ne(sessions.tokenHash, currentTokenHash)));
  await deleteOtherSessionMirrorsForUser(userId, currentTokenHash);
}

/** 비밀번호 재설정 등 — 해당 사용자의 모든 세션 무효화 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
  await deleteAllSessionMirrorsForUser(userId);
}
