/**
 * 인증·권한 검사 헬퍼 (mutation/query 공통).
 */
import "server-only";

import { getCurrentUser } from "@/server/auth/current-user";
import type { User } from "@/server/db/schema/users";

export async function requireUser(): Promise<User | null> {
  return getCurrentUser();
}

export function isAuthor(userId: string, authorId: string): boolean {
  return userId === authorId;
}

/** ADMIN_USERNAMES 환경변수(쉼표 구분)에 포함된 계정 */
export function isAdmin(user: User): boolean {
  const raw = process.env.ADMIN_USERNAMES;
  if (!raw) return false;
  const admins = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return admins.includes(user.username);
}

/** 글 수정·삭제 권한 — 작성자 본인 또는 관리자 */
export function canModifyPost(user: User | null, authorId: string): boolean {
  if (!user) return false;
  return isAuthor(user.id, authorId) || isAdmin(user);
}

/** 댓글 삭제 권한 — 작성자 본인 또는 관리자 */
export function canModifyComment(user: User | null, authorId: string): boolean {
  if (!user) return false;
  return isAuthor(user.id, authorId) || isAdmin(user);
}

/** 관리자 전용 권한 */
export function requireAdmin(user: User | null): user is User {
  return user !== null && isAdmin(user);
}
