/**
 * S3/MinIO 공개 URL — 서버 전용 헬퍼.
 */
import "server-only";

import { env } from "@/lib/env";
import {
  isAllowedStoragePublicSrc,
  isAllowedYoutubeEmbedSrc as isAllowedYoutubeEmbedSrcCore,
  isOwnedAvatarKey,
  isOwnedCommentImageKey,
  isOwnedPostImageKey,
} from "@/lib/media-url-policy";

export { resolveAvatarPublicUrl } from "@/lib/public-object-url";
export { isOwnedAvatarKey, isOwnedCommentImageKey, isOwnedPostImageKey };

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

/** 댓글 본문 img src — 동일 오리진 + comments/ prefix만 허용 */
export function isAllowedCommentImageSrc(src: string): boolean {
  return isAllowedStoragePublicSrc(src, env.S3_PUBLIC_URL, "comments");
}

/** 글 본문 img src — 동일 오리진 + posts/ prefix만 허용 */
export function isAllowedPostImageSrc(src: string): boolean {
  return isAllowedStoragePublicSrc(src, env.S3_PUBLIC_URL, "posts");
}

/** 글 본문 video src — 동일 오리진 + posts/ prefix만 허용 */
export function isAllowedPostVideoSrc(src: string): boolean {
  return isAllowedStoragePublicSrc(src, env.S3_PUBLIC_URL, "posts");
}

/** 유튜브 iframe src — https://www.youtube.com/embed/... 또는 https://www.youtube-nocookie.com/embed/... */
export function isAllowedYoutubeEmbedSrc(src: string): boolean {
  return isAllowedYoutubeEmbedSrcCore(src);
}
