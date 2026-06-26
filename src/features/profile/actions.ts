"use server";

/**
 * 프로필·계정 변경 Server Actions.
 * userId는 항상 getCurrentUser() 세션에서만 취득합니다.
 */
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  changeEmailSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "@/features/profile/validators";
import { getSessionTokenFromCookies } from "@/server/auth/cookies";
import { verifyPassword, hashPassword } from "@/server/auth/password";
import { requireUser } from "@/server/auth/permissions";
import { deleteOtherSessions } from "@/server/auth/session";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export type ProfileActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { displayName, bio } = parsed.data;

  await db
    .update(users)
    .set({
      displayName: displayName || null,
      bio: bio || null,
    })
    .where(eq(users.id, user.id));

  revalidatePath(`/u/${user.username}`);
  return { success: true, message: "프로필이 저장되었습니다." };
}

export async function changePassword(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  if (!user.passwordHash) {
    return { error: "비밀번호가 설정되지 않은 계정입니다." };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { currentPassword, newPassword } = parsed.data;

  // TODO(rate-limit): ioredis로 비밀번호 변경 IP·계정별 레이트 리미팅

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "현재 비밀번호가 올바르지 않습니다." };
  }

  const passwordHash = await hashPassword(newPassword);

  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

  const currentToken = await getSessionTokenFromCookies();
  if (currentToken) {
    await deleteOtherSessions(user.id, currentToken);
  }

  revalidatePath(`/u/${user.username}`);
  return {
    success: true,
    message: "비밀번호가 변경되었습니다. 다른 기기에서는 다시 로그인해야 합니다.",
  };
}

export async function changeEmail(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  if (!user.passwordHash) {
    return { error: "비밀번호가 설정되지 않은 계정입니다." };
  }

  const parsed = changeEmailSchema.safeParse({
    newEmail: formData.get("newEmail"),
    currentPassword: formData.get("currentPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { newEmail, currentPassword } = parsed.data;

  // TODO(rate-limit): ioredis로 이메일 변경 IP·계정별 레이트 리미팅

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "현재 비밀번호가 올바르지 않습니다." };
  }

  if (newEmail === user.email) {
    return { error: "현재 이메일과 동일합니다." };
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, newEmail))
    .limit(1);

  if (existing) {
    return { error: "이미 사용 중인 이메일입니다." };
  }

  await db.update(users).set({ email: newEmail }).where(eq(users.id, user.id));

  // TODO(email-verification): 새 이메일 인증 메일 발송 후 verified 플래그 갱신

  revalidatePath(`/u/${user.username}`);
  return { success: true, message: "이메일이 변경되었습니다." };
}
