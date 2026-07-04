/**
 * S3 객체 key 생성 — 서버 전용, 추측 불가 + 사용자별 격리.
 */
import "server-only";

import { randomUUID } from "node:crypto";
import {
  AVATAR_CONTENT_TYPE_TO_EXT,
  type AvatarContentType,
  COMMENT_IMAGE_CONTENT_TYPE_TO_EXT,
  type CommentImageContentType,
  POST_IMAGE_CONTENT_TYPE_TO_EXT,
  type PostImageContentType,
  POST_VIDEO_CONTENT_TYPE_TO_EXT,
  type PostVideoContentType,
} from "@/features/uploads/constants";

export function generateAvatarObjectKey(userId: string, contentType: AvatarContentType): string {
  const ext = AVATAR_CONTENT_TYPE_TO_EXT[contentType];
  return `avatars/${userId}/${randomUUID()}.${ext}`;
}

export function generateCommentImageObjectKey(userId: string, contentType: CommentImageContentType): string {
  const ext = COMMENT_IMAGE_CONTENT_TYPE_TO_EXT[contentType];
  return `comments/${userId}/${randomUUID()}.${ext}`;
}

export function generatePostImageObjectKey(userId: string, contentType: PostImageContentType): string {
  const ext = POST_IMAGE_CONTENT_TYPE_TO_EXT[contentType];
  return `posts/${userId}/${randomUUID()}.${ext}`;
}

export function generatePostVideoObjectKey(userId: string, contentType: PostVideoContentType): string {
  const ext = POST_VIDEO_CONTENT_TYPE_TO_EXT[contentType];
  return `posts/${userId}/${randomUUID()}.${ext}`;
}
