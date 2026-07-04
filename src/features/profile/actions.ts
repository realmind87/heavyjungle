"use server";

/**
 * 프로필·계정 변경 Server Actions.
 * userId는 항상 getCurrentUser() 세션에서만 취득합니다.
 */
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  changeEmailSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "@/features/profile/validators";
import { hashToken } from "@/lib/auth/token-hash";
import { env } from "@/lib/env";
import { getSessionTokenFromCookies } from "@/server/auth/cookies";
import { verifyPassword, hashPassword } from "@/server/auth/password";
import { getCurrentUser } from "@/server/auth/current-user";
import { requireUser } from "@/server/auth/permissions";
import { deleteOtherSessions } from "@/server/auth/session";
import { db } from "@/server/db";
import { emailChangeTokens, users } from "@/server/db/schema";
import { sendEmail } from "@/server/email/send-email";
import {
  checkRateLimits,
  getClientIp,
  rateLimitErrorMessage,
} from "@/server/rate-limit";

const EMAIL_CHANGE_TOKEN_TTL_MS = 60 * 60 * 1000;

function generateEmailChangeToken(): string {
  return randomBytes(32).toString("base64url");
}

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
  revalidatePath("/", "layout");
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

  const ip = await getClientIp();
  const rateLimit = await checkRateLimits([
    { key: `profile:password:ip:${ip}`, limit: 10, windowSeconds: 15 * 60 },
    { key: `profile:password:user:${user.id}`, limit: 5, windowSeconds: 15 * 60 },
  ]);
  if (!rateLimit.ok) {
    return { error: rateLimitErrorMessage(rateLimit.retryAfterSeconds) };
  }

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

  const ip = await getClientIp();
  const rateLimit = await checkRateLimits([
    { key: `profile:email:ip:${ip}`, limit: 10, windowSeconds: 15 * 60 },
    { key: `profile:email:user:${user.id}`, limit: 5, windowSeconds: 15 * 60 },
  ]);
  if (!rateLimit.ok) {
    return { error: rateLimitErrorMessage(rateLimit.retryAfterSeconds) };
  }

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

  const token = generateEmailChangeToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_CHANGE_TOKEN_TTL_MS);
  const confirmUrl = `${env.APP_URL}/confirm-email-change?token=${encodeURIComponent(token)}`;

  await db.delete(emailChangeTokens).where(eq(emailChangeTokens.userId, user.id));
  await db.insert(emailChangeTokens).values({
    tokenHash,
    userId: user.id,
    newEmail,
    expiresAt,
  });

  try {
    await sendEmail({
      to: newEmail,
      subject: "[Heavy Jungle] 이메일 변경 확인",
      text: `이메일 변경을 요청하셨습니다. 아래 링크에서 변경을 확인해 주세요. (1시간 유효)\n\n${confirmUrl}\n\n본인이 요청하지 않았다면 이 메일을 무시하세요.`,
      html: `<p>이메일 변경을 요청하셨습니다. 아래 링크에서 변경을 확인해 주세요. (1시간 유효)</p><p><a href="${confirmUrl}">${confirmUrl}</a></p><p>본인이 요청하지 않았다면 이 메일을 무시하세요.</p>`,
    });
  } catch {
    await db.delete(emailChangeTokens).where(eq(emailChangeTokens.tokenHash, tokenHash));
    return { error: "인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }

  return {
    success: true,
    message: "새 이메일로 인증 메일을 보냈습니다. 메일함의 링크를 확인해 주세요.",
  };
}

export type ConfirmEmailChangeState = {
  error?: string;
};

/** 이메일 변경 링크 확인 — 세션 없이 토큰만으로 처리 */
export async function confirmEmailChange(
  _prevState: ConfirmEmailChangeState,
  formData: FormData,
): Promise<ConfirmEmailChangeState> {
  const token = formData.get("token");
  if (typeof token !== "string" || !token) {
    return { error: "유효하지 않은 링크입니다." };
  }

  const ip = await getClientIp();
  const rateLimit = await checkRateLimits([
    { key: `profile:email-confirm:ip:${ip}`, limit: 20, windowSeconds: 60 * 60 },
  ]);
  if (!rateLimit.ok) {
    return { error: rateLimitErrorMessage(rateLimit.retryAfterSeconds) };
  }

  const tokenHash = hashToken(token);

  const [row] = await db
    .select({
      id: emailChangeTokens.id,
      userId: emailChangeTokens.userId,
      newEmail: emailChangeTokens.newEmail,
      expiresAt: emailChangeTokens.expiresAt,
      username: users.username,
    })
    .from(emailChangeTokens)
    .innerJoin(users, eq(emailChangeTokens.userId, users.id))
    .where(eq(emailChangeTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row || row.expiresAt.getTime() <= Date.now()) {
    if (row) {
      await db.delete(emailChangeTokens).where(eq(emailChangeTokens.id, row.id));
    }
    return { error: "만료되었거나 유효하지 않은 링크입니다. 이메일 변경을 다시 요청해 주세요." };
  }

  const [emailTaken] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, row.newEmail))
    .limit(1);

  if (emailTaken && emailTaken.id !== row.userId) {
    await db.delete(emailChangeTokens).where(eq(emailChangeTokens.id, row.id));
    return { error: "이미 사용 중인 이메일입니다. 다른 주소로 다시 요청해 주세요." };
  }

  await db.transaction(async (tx) => {
    await tx.update(users).set({ email: row.newEmail }).where(eq(users.id, row.userId));
    await tx.delete(emailChangeTokens).where(eq(emailChangeTokens.userId, row.userId));
  });

  revalidatePath(`/u/${row.username}`);

  const currentUser = await getCurrentUser();
  if (currentUser?.id === row.userId) {
    redirect(`/u/${row.username}?email=updated`);
  }

  redirect("/login?email=updated");
}
