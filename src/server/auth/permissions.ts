/**
 * 인증·권한 검사 헬퍼 (mutation/query 공통).
 */
import "server-only";

import { env } from "@/lib/env";
import {
  canModifyComment as canModifyCommentCore,
  canModifyPost as canModifyPostCore,
  isAdminRole,
  isAdminUser,
  isAuthor,
} from "@/lib/permissions-core";
import { getCurrentUser } from "@/server/auth/current-user";
import type { User } from "@/server/db/schema/users";

export async function requireUser(): Promise<User | null> {
  return getCurrentUser();
}

export { isAuthor };

/** DB role=admin 또는 ADMIN_USERNAMES 환경변수에 포함된 계정 */
export function isAdmin(user: User): boolean {
  return isAdminUser(user, env.ADMIN_USERNAMES);
}

/** 글 수정·삭제 권한 — 작성자 본인 또는 관리자 */
export function canModifyPost(user: User | null, authorId: string): boolean {
  return canModifyPostCore(user, authorId, env.ADMIN_USERNAMES);
}

/** 댓글 삭제 권한 — 작성자 본인 또는 관리자 */
export function canModifyComment(user: User | null, authorId: string): boolean {
  return canModifyCommentCore(user, authorId, env.ADMIN_USERNAMES);
}

/** 관리자 전용 권한 */
export function requireAdmin(user: User | null): user is User {
  return isAdminRole(user, env.ADMIN_USERNAMES);
}

/** 관리자 Server Action/페이지용 — 비관리자는 null */
export async function requireAdminUser(): Promise<User | null> {
  const user = await requireUser();
  if (!requireAdmin(user)) return null;
  return user;
}
