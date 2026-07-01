"use server";

/**
 * 아바타 presigned URL 업로드 Server Actions.
 * userId는 세션에서만 취득, key는 서버 생성, confirm 시 prefix·HeadObject 재검증.
 */
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  AVATAR_ALLOWED_CONTENT_TYPES,
  AVATAR_MAX_BYTES,
  type AvatarContentType,
  type CommentImageContentType,
} from "@/features/uploads/constants";
import { generateAvatarObjectKey, generateCommentImageObjectKey } from "@/features/uploads/keys";
import {
  avatarUploadIntentSchema,
  commentImageUploadIntentSchema,
  confirmAvatarUploadSchema,
} from "@/features/uploads/validators";
import { buildPublicObjectUrl, isOwnedAvatarKey } from "@/lib/storage-url";
import { requireUser } from "@/server/auth/permissions";
import { createPresignedPutUrl, deleteObject, headObject } from "@/server/storage/s3";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export type AvatarUploadUrlResult =
  | { error: string }
  | { uploadUrl: string; key: string; publicUrl: string };

export type ConfirmAvatarUploadResult =
  | { error: string }
  | { success: true; key: string; publicUrl: string };

export type CommentImageUploadUrlResult =
  | { error: string }
  | { uploadUrl: string; key: string; publicUrl: string };

export async function createAvatarUploadUrl(input: {
  filename: string;
  contentType: string;
  size: number;
}): Promise<AvatarUploadUrlResult> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // TODO(rate-limit): ioredis로 presigned URL 발급 IP·계정별 레이트 리미팅

  const parsed = avatarUploadIntentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { contentType, size } = parsed.data;
  const key = generateAvatarObjectKey(user.id, contentType as AvatarContentType);

  try {
    const uploadUrl = await createPresignedPutUrl(key, contentType, size, 60);
    return {
      uploadUrl,
      key,
      publicUrl: buildPublicObjectUrl(key),
    };
  } catch {
    return { error: "업로드 URL 발급에 실패했습니다." };
  }
}

export async function confirmAvatarUpload(key: string): Promise<ConfirmAvatarUploadResult> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const parsed = confirmAvatarUploadSchema.safeParse({ key });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "유효하지 않은 요청입니다." };
  }

  if (!isOwnedAvatarKey(key, user.id)) {
    return { error: "접근 권한이 없습니다." };
  }

  let head;
  try {
    head = await headObject(key);
  } catch {
    return { error: "업로드된 파일을 찾을 수 없습니다." };
  }

  const contentType = head.ContentType;
  if (
    !contentType ||
    !(AVATAR_ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType)
  ) {
    await deleteObject(key).catch(() => undefined);
    return { error: "허용되지 않는 파일 형식입니다." };
  }

  const size = head.ContentLength ?? 0;
  if (size < 1 || size > AVATAR_MAX_BYTES) {
    await deleteObject(key).catch(() => undefined);
    return { error: "파일 크기가 올바르지 않습니다." };
  }

  const previousKey =
    user.avatarUrl && user.avatarUrl.startsWith("avatars/") ? user.avatarUrl : null;

  await db.update(users).set({ avatarUrl: key }).where(eq(users.id, user.id));

  if (previousKey && previousKey !== key) {
    await deleteObject(previousKey).catch(() => undefined);
  }

  revalidatePath(`/u/${user.username}`);

  return {
    success: true,
    key,
    publicUrl: buildPublicObjectUrl(key),
  };
}

export async function createCommentImageUploadUrl(input: {
  filename: string;
  contentType: string;
  size: number;
}): Promise<CommentImageUploadUrlResult> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const parsed = commentImageUploadIntentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { contentType, size } = parsed.data;
  const key = generateCommentImageObjectKey(user.id, contentType as CommentImageContentType);

  try {
    const uploadUrl = await createPresignedPutUrl(key, contentType, size, 60);
    return {
      uploadUrl,
      key,
      publicUrl: buildPublicObjectUrl(key),
    };
  } catch {
    return { error: "업로드 URL 발급에 실패했습니다." };
  }
}
