"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { hashToken } from "@/lib/auth/token-hash";
import { env } from "@/lib/env";
import {
  findUsernameSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/lib/validators/auth";
import { hashPassword } from "@/server/auth/password";
import { deleteAllUserSessions } from "@/server/auth/session";
import { db } from "@/server/db";
import { passwordResetTokens, users } from "@/server/db/schema";
import { sendEmail } from "@/server/email/send-email";
import {
  checkRateLimits,
  getClientIp,
  hashRateLimitId,
  rateLimitErrorMessage,
} from "@/server/rate-limit";

export type RecoveryActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

async function createPasswordResetToken(userId: string): Promise<string> {
  const token = generateResetToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));

  await db.insert(passwordResetTokens).values({
    tokenHash,
    userId,
    expiresAt,
  });

  return token;
}

export async function findUsername(
  _prevState: RecoveryActionState,
  formData: FormData,
): Promise<RecoveryActionState> {
  const parsed = findUsernameSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { email } = parsed.data;
  const ip = await getClientIp();
  const emailKey = hashRateLimitId(email);
  const rateLimit = await checkRateLimits([
    { key: `auth:find-username:ip:${ip}`, limit: 5, windowSeconds: 60 * 60 },
    { key: `auth:find-username:email:${emailKey}`, limit: 3, windowSeconds: 60 * 60 },
  ]);
  if (!rateLimit.ok) {
    return { error: rateLimitErrorMessage(rateLimit.retryAfterSeconds) };
  }

  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return { error: "등록된 이메일이 아닙니다." };
  }

  try {
    await sendEmail({
      to: email,
      subject: "[Heavy Jungle] 아이디 안내",
      text: `가입하신 아이디는 "${user.username}" 입니다.`,
      html: `<p>가입하신 아이디는 <strong>${user.username}</strong> 입니다.</p>`,
    });
  } catch {
    return { error: "메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }

  return { success: true, message: "입력하신 이메일로 아이디를 발송했습니다." };
}

export async function requestPasswordReset(
  _prevState: RecoveryActionState,
  formData: FormData,
): Promise<RecoveryActionState> {
  const parsed = requestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { email } = parsed.data;
  const ip = await getClientIp();
  const emailKey = hashRateLimitId(email);
  const rateLimit = await checkRateLimits([
    { key: `auth:reset-request:ip:${ip}`, limit: 5, windowSeconds: 60 * 60 },
    { key: `auth:reset-request:email:${emailKey}`, limit: 3, windowSeconds: 60 * 60 },
  ]);
  if (!rateLimit.ok) {
    return { error: rateLimitErrorMessage(rateLimit.retryAfterSeconds) };
  }

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return { error: "등록된 이메일이 아닙니다." };
  }

  if (!user.passwordHash) {
    return { error: "소셜 로그인 등 비밀번호가 없는 계정입니다." };
  }

  try {
    const token = await createPasswordResetToken(user.id);
    const resetUrl = `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

    await sendEmail({
      to: email,
      subject: "[Heavy Jungle] 비밀번호 재설정",
      text: `아래 링크에서 비밀번호를 재설정할 수 있습니다. (1시간 유효)\n\n${resetUrl}`,
      html: `<p>아래 링크에서 비밀번호를 재설정할 수 있습니다. (1시간 유효)</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  } catch {
    return { error: "메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }

  return { success: true, message: "입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다." };
}

export async function resetPassword(
  _prevState: RecoveryActionState,
  formData: FormData,
): Promise<RecoveryActionState> {
  const ip = await getClientIp();
  const ipLimit = await checkRateLimits([
    { key: `auth:reset-password:ip:${ip}`, limit: 10, windowSeconds: 60 * 60 },
  ]);
  if (!ipLimit.ok) {
    return { error: rateLimitErrorMessage(ipLimit.retryAfterSeconds) };
  }

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);

  const [row] = await db
    .select({
      tokenId: passwordResetTokens.id,
      expiresAt: passwordResetTokens.expiresAt,
      userId: passwordResetTokens.userId,
      passwordHash: users.passwordHash,
    })
    .from(passwordResetTokens)
    .innerJoin(users, eq(passwordResetTokens.userId, users.id))
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row || row.expiresAt.getTime() <= Date.now()) {
    if (row) {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, row.tokenId));
    }
    return { error: "만료되었거나 유효하지 않은 링크입니다. 비밀번호 찾기를 다시 요청해 주세요." };
  }

  const passwordHash = await hashPassword(password);

  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash }).where(eq(users.id, row.userId));
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, row.userId));
  });

  await deleteAllUserSessions(row.userId);

  redirect("/login?reset=success");
}
