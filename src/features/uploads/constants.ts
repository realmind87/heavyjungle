/**
 * 업로드 상수 — 허용 MIME, 최대 크기.
 */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5MB

export const AVATAR_ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AvatarContentType = (typeof AVATAR_ALLOWED_CONTENT_TYPES)[number];

export const AVATAR_CONTENT_TYPE_TO_EXT: Record<AvatarContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
