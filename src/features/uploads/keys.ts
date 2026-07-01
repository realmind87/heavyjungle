/**
 * S3 객체 key 생성 — 서버 전용, 추측 불가 + 사용자별 격리.
 */
import "server-only";

import { randomUUID } from "node:crypto";
import {
  AVATAR_CONTENT_TYPE_TO_EXT,
  type AvatarContentType,
  type CommentImageContentType,
} from "@/features/uploads/constants";

export function generateAvatarObjectKey(userId: string, contentType: AvatarContentType): string {
  const ext = AVATAR_CONTENT_TYPE_TO_EXT[contentType];
  return `avatars/${userId}/${randomUUID()}.${ext}`;
}

export function generateCommentImageObjectKey(userId: string, contentType: CommentImageContentType): string {
  const ext = AVATAR_CONTENT_TYPE_TO_EXT[contentType];
  return `comments/${userId}/${randomUUID()}.${ext}`;
}
