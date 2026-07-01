/**
 * S3/MinIO 공개 URL 조합.
 *
 * URL 전략: DB(avatarUrl)에는 object key만 저장 (예: avatars/{userId}/{uuid}.jpg).
 * 렌더 시 S3_PUBLIC_URL + key로 조합 → 버킷/도메인 변경 시 DB 마이그레이션 불필요.
 * 레거시: http(s)로 시작하면 외부 URL 직접 입력 값으로 간주해 그대로 사용.
 */
import "server-only";

import { env } from "@/lib/env";

export function buildPublicObjectUrl(key: string): string {
  const base = env.S3_PUBLIC_URL.replace(/\/$/, "");
  return `${base}/${key}`;
}

export function resolveAvatarPublicUrl(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (stored.startsWith("http://") || stored.startsWith("https://")) {
    return stored;
  }
  return buildPublicObjectUrl(stored);
}

export function isOwnedAvatarKey(key: string, userId: string): boolean {
  return key.startsWith(`avatars/${userId}/`);
}

export function isOwnedCommentImageKey(key: string, userId: string): boolean {
  return key.startsWith(`comments/${userId}/`);
}

/** 댓글 본문 img src — 동일 오리진 + comments/ prefix만 허용 */
export function isAllowedCommentImageSrc(src: string): boolean {
  try {
    const url = new URL(src);
    const base = new URL(env.S3_PUBLIC_URL);
    const basePath = base.pathname.replace(/\/$/, "");
    return url.origin === base.origin && url.pathname.startsWith(`${basePath}/comments/`);
  } catch {
    return false;
  }
}
