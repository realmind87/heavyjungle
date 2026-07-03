/**
 * S3/MinIO 공개 URL — 서버 전용 헬퍼.
 */
import "server-only";

import { env } from "@/lib/env";

export { resolveAvatarPublicUrl } from "@/lib/public-object-url";

/** DB key 또는 절대 URL → S3_PUBLIC_URL 기준 공개 URL (서버 전용) */
export function resolveStoragePublicUrl(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (stored.startsWith("http://") || stored.startsWith("https://")) {
    return stored;
  }
  return buildPublicObjectUrl(stored);
}

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

export function isOwnedPostImageKey(key: string, userId: string): boolean {
  return key.startsWith(`posts/${userId}/`);
}

/** 댓글 본문 img src — 동일 오리진 + comments/ prefix만 허용 */
export function isAllowedCommentImageSrc(src: string): boolean {
  return isAllowedStorageImageSrc(src, "comments");
}

/** 글 본문 img src — 동일 오리진 + posts/ prefix만 허용 */
export function isAllowedPostImageSrc(src: string): boolean {
  return isAllowedStorageImageSrc(src, "posts");
}

/** 글 본문 video src — 동일 오리진 + posts/ prefix만 허용 */
export function isAllowedPostVideoSrc(src: string): boolean {
  return isAllowedStorageImageSrc(src, "posts");
}

/** 유튜브 iframe src — https://www.youtube.com/embed/... 또는 https://www.youtube-nocookie.com/embed/... */
export function isAllowedYoutubeEmbedSrc(src: string): boolean {
  try {
    const url = new URL(src);
    if (url.protocol !== "https:") return false;
    if (url.hostname !== "www.youtube.com" && url.hostname !== "www.youtube-nocookie.com") {
      return false;
    }
    return url.pathname.startsWith("/embed/");
  } catch {
    return false;
  }
}

function isAllowedStorageImageSrc(src: string, prefix: "comments" | "posts"): boolean {
  try {
    const url = new URL(src);
    const base = new URL(env.S3_PUBLIC_URL);
    const basePath = base.pathname.replace(/\/$/, "");
    return url.origin === base.origin && url.pathname.startsWith(`${basePath}/${prefix}/`);
  } catch {
    return false;
  }
}
