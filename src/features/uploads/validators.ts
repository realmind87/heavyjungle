/**
 * 업로드 입력 검증 (Zod v4).
 * 클라이언트가 보낸 contentType/size는 서버에서 재검증합니다.
 */
import { z } from "zod";
import {
  AVATAR_ALLOWED_CONTENT_TYPES,
  AVATAR_MAX_BYTES,
  COMMENT_IMAGE_ALLOWED_CONTENT_TYPES,
  COMMENT_IMAGE_MAX_BYTES,
} from "@/features/uploads/constants";

export const avatarUploadIntentSchema = z.object({
  filename: z.string().trim().min(1, "파일명이 필요합니다.").max(255),
  contentType: z.enum(AVATAR_ALLOWED_CONTENT_TYPES, {
    message: "JPEG, PNG, WebP 이미지만 업로드할 수 있습니다.",
  }),
  size: z
    .number()
    .int()
    .min(1, "파일 크기가 올바르지 않습니다.")
    .max(AVATAR_MAX_BYTES, "파일 크기는 5MB 이하여야 합니다."),
});

export type AvatarUploadIntent = z.infer<typeof avatarUploadIntentSchema>;

export const confirmAvatarUploadSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(512)
    .regex(/^avatars\/[0-9a-f-]+\/[0-9a-f-]+\.(jpg|png|webp)$/i, "유효하지 않은 객체 key입니다."),
});

export type ConfirmAvatarUploadInput = z.infer<typeof confirmAvatarUploadSchema>;

export const commentImageUploadIntentSchema = z.object({
  filename: z.string().trim().min(1, "파일명이 필요합니다.").max(255),
  contentType: z.enum(COMMENT_IMAGE_ALLOWED_CONTENT_TYPES, {
    message: "JPEG, PNG, WebP 이미지만 업로드할 수 있습니다.",
  }),
  size: z
    .number()
    .int()
    .min(1, "파일 크기가 올바르지 않습니다.")
    .max(COMMENT_IMAGE_MAX_BYTES, "파일 크기는 5MB 이하여야 합니다."),
});

export type CommentImageUploadIntent = z.infer<typeof commentImageUploadIntentSchema>;
