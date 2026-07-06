import "server-only";

import { desc, eq, and, ne } from "drizzle-orm";
import { summarizeUserAgent } from "@/server/auth/client-info";
import { deleteSessionById } from "@/server/auth/session";
import { db } from "@/server/db";
import { sessions } from "@/server/db/schema";
import { sendEmail } from "@/server/email/send-email";
import { env } from "@/lib/env";

export type UserSessionSummary = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  deviceLabel: string;
  lastSeenAt: Date;
  createdAt: Date;
  isCurrent: boolean;
};

export async function listUserSessions(userId: string, currentTokenHash: string): Promise<UserSessionSummary[]> {
  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.lastSeenAt));

  return rows.map((row) => ({
    id: row.id,
    userAgent: row.userAgent,
    ipAddress: row.ipAddress,
    deviceLabel: summarizeUserAgent(row.userAgent),
    lastSeenAt: row.lastSeenAt,
    createdAt: row.createdAt,
    isCurrent: row.tokenHash === currentTokenHash,
  }));
}

export async function revokeUserSession(userId: string, sessionId: string, currentTokenHash: string): Promise<boolean> {
  const [row] = await db
    .select({ id: sessions.id, tokenHash: sessions.tokenHash })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
    .limit(1);

  if (!row || row.tokenHash === currentTokenHash) {
    return false;
  }

  await deleteSessionById(sessionId, userId);
  return true;
}

export async function shouldNotifyNewLogin(userId: string, ipAddress: string): Promise<boolean> {
  const rows = await db
    .select({ ipAddress: sessions.ipAddress })
    .from(sessions)
    .where(eq(sessions.userId, userId));

  if (rows.length === 0) return false;
  return !rows.some((row) => row.ipAddress === ipAddress);
}

export async function sendNewLoginNotification(options: {
  email: string;
  username: string;
  ipAddress: string;
  userAgent: string | null;
}): Promise<void> {
  const device = summarizeUserAgent(options.userAgent);
  const when = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  await sendEmail({
    to: options.email,
    subject: "[Heavy Jungle] 새 로그인 알림",
    text: `안녕하세요 ${options.username}님,\n\n계정에 새 로그인이 감지되었습니다.\n- 시간: ${when}\n- IP: ${options.ipAddress}\n- 기기: ${device}\n\n본인이 아니라면 비밀번호를 변경하고 설정에서 다른 세션을 종료해 주세요.\n${env.APP_URL}/u/${options.username}/settings/security`,
    html: `<p>안녕하세요 <strong>${options.username}</strong>님,</p><p>계정에 새 로그인이 감지되었습니다.</p><ul><li>시간: ${when}</li><li>IP: ${options.ipAddress}</li><li>기기: ${device}</li></ul><p>본인이 아니라면 비밀번호를 변경하고 <a href="${env.APP_URL}/u/${options.username}/settings/security">보안 설정</a>에서 다른 세션을 종료해 주세요.</p>`,
  });
}

export async function touchSessionLastSeen(sessionId: string): Promise<void> {
  await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, sessionId));
}

export async function countOtherSessions(userId: string, currentTokenHash: string): Promise<number> {
  const rows = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), ne(sessions.tokenHash, currentTokenHash)));
  return rows.length;
}
