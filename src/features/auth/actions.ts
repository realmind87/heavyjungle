"use server";

import { eq, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { signInSchema, signUpSchema } from "@/lib/validators/auth";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { clearSessionCookie, getSessionTokenFromCookies, setSessionCookie } from "@/server/auth/cookies";
import { createSession, deleteSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export type AuthActionState = {
  error?: string;
};

const INVALID_CREDENTIALS_MESSAGE = "이메일(아이디) 또는 비밀번호가 올바르지 않습니다.";

function getSafeRedirectPath(next: FormDataEntryValue | null): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  return next;
}

export async function signUp(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { username, email, password } = parsed.data;

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
    .values({ username, email, passwordHash })
    .returning({ id: users.id });

  const token = await createSession(created.id);
  await setSessionCookie(token);

  redirect(getSafeRedirectPath(formData.get("next")));
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

  const token = await createSession(user.id);
  await setSessionCookie(token);

  redirect(getSafeRedirectPath(formData.get("next")));
}

export async function signOut(): Promise<void> {
  const token = await getSessionTokenFromCookies();
  if (token) {
    await deleteSession(token);
  }
  await clearSessionCookie();
  redirect("/");
}
