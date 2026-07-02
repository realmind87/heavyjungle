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

export const COMMENT_IMAGE_MAX_BYTES = AVATAR_MAX_BYTES;
export const COMMENT_IMAGE_ALLOWED_CONTENT_TYPES = AVATAR_ALLOWED_CONTENT_TYPES;
export type CommentImageContentType = AvatarContentType;

export const POST_IMAGE_MAX_BYTES = 100 * 1024 * 1024; // 100MB
export const POST_IMAGE_ALLOWED_CONTENT_TYPES = AVATAR_ALLOWED_CONTENT_TYPES;
export type PostImageContentType = AvatarContentType;

export const POST_VIDEO_MAX_BYTES = 1024 * 1024 * 1024; // 1GB
export const POST_VIDEO_ALLOWED_CONTENT_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;
export type PostVideoContentType = (typeof POST_VIDEO_ALLOWED_CONTENT_TYPES)[number];

export const AVATAR_CONTENT_TYPE_TO_EXT: Record<AvatarContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const POST_VIDEO_CONTENT_TYPE_TO_EXT: Record<PostVideoContentType, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};
