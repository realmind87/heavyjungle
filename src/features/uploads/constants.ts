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
export const COMMENT_IMAGE_ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
export type CommentImageContentType = (typeof COMMENT_IMAGE_ALLOWED_CONTENT_TYPES)[number];

export const COMMENT_IMAGE_CONTENT_TYPE_TO_EXT: Record<CommentImageContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const COMMENT_IMAGE_EXT_TO_CONTENT_TYPE: Record<string, CommentImageContentType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** file.type 미설정 등 — 파일명 확장자로 MIME 추론 */
export function resolveCommentImageContentType(file: File): CommentImageContentType | null {
  if ((COMMENT_IMAGE_ALLOWED_CONTENT_TYPES as readonly string[]).includes(file.type)) {
    return file.type as CommentImageContentType;
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return COMMENT_IMAGE_EXT_TO_CONTENT_TYPE[ext] ?? null;
}

export const POST_IMAGE_MAX_BYTES = 100 * 1024 * 1024; // 100MB
export const POST_IMAGE_ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
export type PostImageContentType = (typeof POST_IMAGE_ALLOWED_CONTENT_TYPES)[number];

export const POST_IMAGE_CONTENT_TYPE_TO_EXT: Record<PostImageContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const POST_IMAGE_EXT_TO_CONTENT_TYPE: Record<string, PostImageContentType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** file.type 미설정 등 — 파일명 확장자로 MIME 추론 */
export function resolvePostImageContentType(file: File): PostImageContentType | null {
  if ((POST_IMAGE_ALLOWED_CONTENT_TYPES as readonly string[]).includes(file.type)) {
    return file.type as PostImageContentType;
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return POST_IMAGE_EXT_TO_CONTENT_TYPE[ext] ?? null;
}

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
