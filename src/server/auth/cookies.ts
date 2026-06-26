/**
 * 세션 쿠키 설정/삭제 (Next.js cookies API).
 */
import "server-only";

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-token";

export { SESSION_COOKIE_NAME };

/** 30일 (초) */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}
