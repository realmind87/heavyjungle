/**
 * 요청 단위 현재 로그인 유저 조회 (React cache 메모이즈).
 */
import "server-only";

import { cache } from "react";
import { getSessionTokenFromCookies } from "./cookies";
import { validateSession } from "./session";

export const getCurrentUser = cache(async () => {
  const token = await getSessionTokenFromCookies();
  if (!token) return null;

  const session = await validateSession(token);
  return session?.user ?? null;
});
