"use server";

import { eq, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { RECOVERY_EMAIL_SENT_MESSAGE } from "@/lib/auth/recovery-messages";
import { assertPasswordNotBreached } from "@/lib/password-breach";
import { signInSchema, signUpSchema } from "@/lib/validators/auth";
import { getUserAgent } from "@/server/auth/client-info";
import {
  createEmailVerificationToken,
  isEmailVerified,
  sendVerificationEmail,
} from "@/server/auth/email-verification";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { clearSessionCookie, getSessionTokenFromCookies, setSessionCookie } from "@/server/auth/cookies";
import { createSession, deleteSession } from "@/server/auth/session";
import {
  sendNewLoginNotification,
  shouldNotifyNewLogin,
} from "@/server/auth/session-management";
import {
  consumePendingLogin,
  createPendingLogin,
  isTotpEnabled,
  verifyTotpCode,
} from "@/server/auth/totp";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import {
  checkRateLimits,
  getClientIp,
  hashRateLimitId,
  rateLimitErrorMessage,
} from "@/server/rate-limit";

export type AuthActionState = {
  error?: string;
  success?: boolean;
  message?: string;
  needsTotp?: boolean;
  pendingLoginToken?: string;
};

const INVALID_CREDENTIALS_MESSAGE = "이메일(아이디) 또는 비밀번호가 올바르지 않습니다.";
const EMAIL_NOT_VERIFIED_MESSAGE =
  "이메일 인증이 필요합니다. 가입 시 받은 메일의 링크를 확인하거나 인증 메일을 다시 요청해 주세요.";

function getSafeRedirectPath(next: FormDataEntryValue | null): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  return next;
}

async function finishLogin(userId: string, next: string): Promise<never> {
  const ip = await getClientIp();
  const userAgent = await getUserAgent();

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    redirect("/login");
  }

  if (await shouldNotifyNewLogin(user.id, ip)) {
    try {
      await sendNewLoginNotification({
        email: user.email,
        username: user.username,
        ipAddress: ip,
        userAgent,
      });
    } catch {
      // 알림 실패는 로그인을 막지 않음
    }
  }

  const token = await createSession(user.id, { ipAddress: ip, userAgent });
  await setSessionCookie(token);
  redirect(next);
}

export async function signUp(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const ip = await getClientIp();
  const ipLimit = await checkRateLimits([
    { key: `auth:signup:ip:${ip}`, limit: 5, windowSeconds: 60 * 60 },
  ]);
  if (!ipLimit.ok) {
    return { error: rateLimitErrorMessage(ipLimit.retryAfterSeconds) };
  }

  const parsed = signUpSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { username, email, password } = parsed.data;

  const breachError = await assertPasswordNotBreached(password);
  if (breachError) {
    return { error: breachError };
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.email, email), eq(users.username, username)))
    .limit(1);

  if (existing) {
    return { error: "이미 사용 중인 이메일 또는 아이디입니다." };
  }

  const passwordHash = await hashPassword(password);

  const [created] = await db
    .insert(users)
    .values({ username, email, passwordHash, emailVerifiedAt: null })
    .returning({ id: users.id });

  try {
    const token = await createEmailVerificationToken(created.id);
    await sendVerificationEmail(email, token);
  } catch {
    return { error: "인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }

  return {
    success: true,
    message: "가입이 완료되었습니다. 이메일로 발송된 인증 링크를 확인한 뒤 로그인해 주세요.",
  };
}

export async function signIn(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    login: formData.get("login"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { login, password } = parsed.data;
  const next = getSafeRedirectPath(formData.get("next"));
  const ip = await getClientIp();
  const loginKey = hashRateLimitId(login);
  const rateLimit = await checkRateLimits([
    { key: `auth:signin:ip:${ip}`, limit: 20, windowSeconds: 15 * 60 },
    { key: `auth:signin:login:${loginKey}`, limit: 10, windowSeconds: 15 * 60 },
  ]);
  if (!rateLimit.ok) {
    return { error: rateLimitErrorMessage(rateLimit.retryAfterSeconds) };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, login), eq(users.username, login)))
    .limit(1);

  if (!user?.passwordHash) {
    return { error: INVALID_CREDENTIALS_MESSAGE };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: INVALID_CREDENTIALS_MESSAGE };
  }

  if (!isEmailVerified(user)) {
    return { error: EMAIL_NOT_VERIFIED_MESSAGE };
  }

  if (isTotpEnabled(user)) {
    const pendingLoginToken = await createPendingLogin(user.id, next);
    return { needsTotp: true, pendingLoginToken };
  }

  await finishLogin(user.id, next);
  return {};
}

export async function verifyTotpLogin(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const pendingLoginToken = formData.get("pendingLoginToken");
  const code = formData.get("code");

  if (typeof pendingLoginToken !== "string" || typeof code !== "string") {
    return { error: "인증 정보가 올바르지 않습니다." };
  }

  const pending = await consumePendingLogin(pendingLoginToken);
  if (!pending) {
    return { error: "인증 시간이 만료되었습니다. 다시 로그인해 주세요." };
  }

  const [user] = await db.select().from(users).where(eq(users.id, pending.userId)).limit(1);
  if (!user?.totpSecret || !isTotpEnabled(user)) {
    return { error: "2단계 인증이 설정되지 않았습니다." };
  }

  if (!verifyTotpCode(user.totpSecret, code.trim())) {
    return { error: "인증 코드가 올바르지 않습니다." };
  }

  await finishLogin(user.id, pending.next);
  return {};
}

export async function resendVerificationEmail(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email");
  if (typeof email !== "string" || !email) {
    return { error: "이메일을 입력해 주세요." };
  }

  const ip = await getClientIp();
  const emailKey = hashRateLimitId(email);
  const rateLimit = await checkRateLimits([
    { key: `auth:resend-verify:ip:${ip}`, limit: 5, windowSeconds: 60 * 60 },
    { key: `auth:resend-verify:email:${emailKey}`, limit: 3, windowSeconds: 60 * 60 },
  ]);
  if (!rateLimit.ok) {
    return { error: rateLimitErrorMessage(rateLimit.retryAfterSeconds) };
  }

  const [user] = await db
    .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user && !isEmailVerified(user)) {
    try {
      const token = await createEmailVerificationToken(user.id);
      await sendVerificationEmail(email, token);
    } catch {
      return { error: "메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요." };
    }
  }

  return { success: true, message: RECOVERY_EMAIL_SENT_MESSAGE };
}

export async function signOut(): Promise<void> {
  const token = await getSessionTokenFromCookies();
  if (token) {
    await deleteSession(token);
  }
  await clearSessionCookie();
  redirect("/");
}
