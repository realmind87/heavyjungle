"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionTokenFromCookies } from "@/server/auth/cookies";
import { verifyPassword } from "@/server/auth/password";
import { requireUser } from "@/server/auth/permissions";
import {
  hashSessionTokenForLookup,
  deleteOtherSessions,
} from "@/server/auth/session";
import { revokeUserSession } from "@/server/auth/session-management";
import {
  consumePendingTotpSetup,
  createPendingTotpSetup,
  generateTotpSecret,
  getTotpUri,
  isTotpEnabled,
  verifyTotpCode,
} from "@/server/auth/totp";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export type SecurityActionState = {
  error?: string;
  success?: boolean;
  message?: string;
  pendingTotpToken?: string;
  totpUri?: string;
  totpSecret?: string;
};

const totpCodeSchema = z.string().trim().regex(/^\d{6}$/, "6자리 인증 코드를 입력해 주세요.");

export async function beginTotpSetup(
  _prevState: SecurityActionState,
  formData: FormData,
): Promise<SecurityActionState> {
  const user = await requireUser();
  if (!user) return { error: "로그인이 필요합니다." };
  if (!user.passwordHash) return { error: "비밀번호가 설정되지 않은 계정입니다." };
  if (isTotpEnabled(user)) return { error: "이미 2단계 인증이 활성화되어 있습니다." };

  const password = formData.get("password");
  if (typeof password !== "string" || !password) {
    return { error: "현재 비밀번호를 입력해 주세요." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "현재 비밀번호가 올바르지 않습니다." };

  const secret = generateTotpSecret();
  const pendingTotpToken = await createPendingTotpSetup(user.id, secret);

  return {
    pendingTotpToken,
    totpSecret: secret,
    totpUri: getTotpUri(secret, user.email),
    message: "인증 앱에 계정을 추가한 뒤 6자리 코드를 입력해 주세요.",
  };
}

export async function confirmTotpSetup(
  _prevState: SecurityActionState,
  formData: FormData,
): Promise<SecurityActionState> {
  const user = await requireUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const pendingTotpToken = formData.get("pendingTotpToken");
  const code = formData.get("code");
  if (typeof pendingTotpToken !== "string" || typeof code !== "string") {
    return { error: "입력값을 확인해 주세요." };
  }

  const parsed = totpCodeSchema.safeParse(code);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "인증 코드를 확인해 주세요." };
  }

  const pending = await consumePendingTotpSetup(pendingTotpToken);
  if (!pending || pending.userId !== user.id) {
    return { error: "설정 시간이 만료되었습니다. 다시 시도해 주세요." };
  }

  if (!verifyTotpCode(pending.secret, parsed.data)) {
    return { error: "인증 코드가 올바르지 않습니다." };
  }

  await db
    .update(users)
    .set({ totpSecret: pending.secret, totpEnabledAt: new Date() })
    .where(eq(users.id, user.id));

  revalidatePath(`/u/${user.username}/settings/security`);
  return { success: true, message: "2단계 인증이 활성화되었습니다." };
}

export async function disableTotp(
  _prevState: SecurityActionState,
  formData: FormData,
): Promise<SecurityActionState> {
  const user = await requireUser();
  if (!user) return { error: "로그인이 필요합니다." };
  if (!user.passwordHash || !isTotpEnabled(user)) {
    return { error: "2단계 인증이 활성화되어 있지 않습니다." };
  }

  const password = formData.get("password");
  const code = formData.get("code");
  if (typeof password !== "string" || typeof code !== "string") {
    return { error: "입력값을 확인해 주세요." };
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) return { error: "현재 비밀번호가 올바르지 않습니다." };

  const parsed = totpCodeSchema.safeParse(code);
  if (!parsed.success || !user.totpSecret || !verifyTotpCode(user.totpSecret, parsed.data)) {
    return { error: "인증 코드가 올바르지 않습니다." };
  }

  await db
    .update(users)
    .set({ totpSecret: null, totpEnabledAt: null })
    .where(eq(users.id, user.id));

  revalidatePath(`/u/${user.username}/settings/security`);
  return { success: true, message: "2단계 인증이 비활성화되었습니다." };
}

export async function revokeSession(
  _prevState: SecurityActionState,
  formData: FormData,
): Promise<SecurityActionState> {
  const user = await requireUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const sessionId = formData.get("sessionId");
  if (typeof sessionId !== "string" || !sessionId) {
    return { error: "세션 정보가 올바르지 않습니다." };
  }

  const currentToken = await getSessionTokenFromCookies();
  if (!currentToken) return { error: "로그인이 필요합니다." };
  const currentTokenHash = await hashSessionTokenForLookup(currentToken);

  const ok = await revokeUserSession(user.id, sessionId, currentTokenHash);
  if (!ok) {
    return { error: "세션을 종료할 수 없습니다." };
  }

  revalidatePath(`/u/${user.username}/settings/security`);
  return { success: true, message: "세션이 종료되었습니다." };
}

export async function revokeOtherSessions(
  _prevState: SecurityActionState,
  _formData: FormData,
): Promise<SecurityActionState> {
  void _prevState;
  void _formData;
  const user = await requireUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const currentToken = await getSessionTokenFromCookies();
  if (!currentToken) return { error: "로그인이 필요합니다." };

  await deleteOtherSessions(user.id, currentToken);
  revalidatePath(`/u/${user.username}/settings/security`);
  return { success: true, message: "다른 기기의 세션을 모두 종료했습니다." };
}
