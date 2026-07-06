import "server-only";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { hashToken } from "@/lib/auth/token-hash";
import { env } from "@/lib/env";
import { db } from "@/server/db";
import { emailVerificationTokens, users } from "@/server/db/schema";
import { sendEmail } from "@/server/email/send-email";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function generateVerificationToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createEmailVerificationToken(userId: string): Promise<string> {
  const token = generateVerificationToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
  await db.insert(emailVerificationTokens).values({ tokenHash, userId, expiresAt });

  return token;
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verifyUrl = `${env.APP_URL}/verify-email?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: email,
    subject: "[Heavy Jungle] 이메일 인증",
    text: `아래 링크에서 이메일 인증을 완료해 주세요. (24시간 유효)\n\n${verifyUrl}`,
    html: `<p>아래 링크에서 이메일 인증을 완료해 주세요. (24시간 유효)</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
}

export async function verifyEmailToken(token: string): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const tokenHash = hashToken(token);

  const [row] = await db
    .select({
      tokenId: emailVerificationTokens.id,
      expiresAt: emailVerificationTokens.expiresAt,
      userId: emailVerificationTokens.userId,
      username: users.username,
    })
    .from(emailVerificationTokens)
    .innerJoin(users, eq(emailVerificationTokens.userId, users.id))
    .where(eq(emailVerificationTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row || row.expiresAt.getTime() <= Date.now()) {
    if (row) {
      await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, row.tokenId));
    }
    return { ok: false, error: "만료되었거나 유효하지 않은 링크입니다." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(users.id, row.userId));
    await tx.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, row.userId));
  });

  return { ok: true, username: row.username };
}

export function isEmailVerified(user: { emailVerifiedAt: Date | null }): boolean {
  return user.emailVerifiedAt != null;
}
