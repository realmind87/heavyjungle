/**
 * S3/MinIO 공개 URL — 서버 전용 헬퍼.
 */
import "server-only";

import { env } from "@/lib/env";

export { resolveAvatarPublicUrl } from "@/lib/public-object-url";

export function buildPublicObjectUrl(key: string): string {
  const base = env.S3_PUBLIC_URL.replace(/\/$/, "");
  return `${base}/${key}`;
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
