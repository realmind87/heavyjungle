import "server-only";

import { randomBytes } from "node:crypto";
import { generateSecret, generateURI, verifySync } from "otplib";
import { cacheDel, cacheGet, cacheKey, cacheSet } from "@/lib/cache";

const PENDING_LOGIN_TTL_SECONDS = 5 * 60;
const PENDING_TOTP_SETUP_TTL_SECONDS = 10 * 60;

type PendingLogin = {
  userId: string;
  next: string;
};

type PendingTotpSetup = {
  userId: string;
  secret: string;
};

export function generateTotpSecret(): string {
  return generateSecret();
}

export function getTotpUri(secret: string, accountName: string): string {
  return generateURI({ issuer: "Heavy Jungle", label: accountName, secret });
}

export function verifyTotpCode(secret: string, code: string): boolean {
  return verifySync({ secret, token: code }).valid;
}

export function isTotpEnabled(user: { totpEnabledAt: Date | null; totpSecret: string | null }): boolean {
  return user.totpEnabledAt != null && Boolean(user.totpSecret);
}

export async function createPendingLogin(userId: string, next: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await cacheSet(cacheKey("auth", "pending-login", token), { userId, next } satisfies PendingLogin, PENDING_LOGIN_TTL_SECONDS);
  return token;
}

export async function consumePendingLogin(token: string): Promise<PendingLogin | null> {
  const key = cacheKey("auth", "pending-login", token);
  const data = await cacheGet<PendingLogin>(key);
  if (!data) return null;
  await cacheDel(key);
  return data;
}

export async function createPendingTotpSetup(userId: string, secret: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await cacheSet(
    cacheKey("auth", "pending-totp", token),
    { userId, secret } satisfies PendingTotpSetup,
    PENDING_TOTP_SETUP_TTL_SECONDS,
  );
  return token;
}

export async function consumePendingTotpSetup(token: string): Promise<PendingTotpSetup | null> {
  const key = cacheKey("auth", "pending-totp", token);
  const data = await cacheGet<PendingTotpSetup>(key);
  if (!data) return null;
  await cacheDel(key);
  return data;
}
