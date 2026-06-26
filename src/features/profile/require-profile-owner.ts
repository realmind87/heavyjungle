/**
 * 프로필 수정/설정 페이지 접근 제어.
 * URL의 username을 신뢰하지 않고 세션 사용자와 비교합니다.
 */
import "server-only";

import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import type { User } from "@/server/db/schema/users";

export async function requireProfileOwner(username: string, returnPath: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  }
  if (user.username !== username) {
    notFound();
  }
  return user;
}
