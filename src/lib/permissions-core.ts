/** 순수 권한 판별 — server-only/env 없이 테스트 가능 */
type AuthUser = { id: string; role: string; username: string };

export function isAuthor(userId: string, authorId: string): boolean {
  return userId === authorId;
}

export function isAdminUser(user: AuthUser, adminUsernames: readonly string[]): boolean {
  if (user.role === "admin") return true;
  return adminUsernames.includes(user.username);
}

export function canModifyPost(
  user: AuthUser | null,
  authorId: string,
  adminUsernames: readonly string[],
): boolean {
  if (!user) return false;
  return isAuthor(user.id, authorId) || isAdminUser(user, adminUsernames);
}

export function canModifyComment(
  user: AuthUser | null,
  authorId: string,
  adminUsernames: readonly string[],
): boolean {
  return canModifyPost(user, authorId, adminUsernames);
}

export function isAdminRole(
  user: AuthUser | null,
  adminUsernames: readonly string[],
): user is AuthUser {
  return user !== null && isAdminUser(user, adminUsernames);
}
