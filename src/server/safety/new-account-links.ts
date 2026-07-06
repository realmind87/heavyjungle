/**
 * 신규 계정 외부 링크 — 레이트리밋 + 시스템 자동 신고 (검토 대기).
 */
import "server-only";

import { and, eq } from "drizzle-orm";
import { hasExternalLinks } from "@/lib/link-url-policy";
import {
  NEW_ACCOUNT_EXTERNAL_LINK_COMMENT_LIMIT,
  NEW_ACCOUNT_EXTERNAL_LINK_COMMENT_WINDOW_SECONDS,
  NEW_ACCOUNT_EXTERNAL_LINK_POST_LIMIT,
  NEW_ACCOUNT_EXTERNAL_LINK_POST_WINDOW_SECONDS,
  NEW_ACCOUNT_EXTERNAL_LINK_RATE_LIMIT_MESSAGE,
  newAccountAgeDays,
  shouldApplyNewAccountLinkPolicy,
} from "@/lib/new-account-link-policy";
import { logger } from "@/lib/logger";
import { isAdmin } from "@/server/auth/permissions";
import { db } from "@/server/db";
import { reports } from "@/server/db/schema";
import type { User } from "@/server/db/schema/users";
import { checkRateLimit, rateLimitErrorMessage } from "@/server/rate-limit";

const SYSTEM_REPORT_DETAIL_PREFIX = "신규 계정 외부 링크 자동 검토";

type ContentTarget = "post" | "comment";

function rateLimitKey(userId: string, target: ContentTarget): string {
  return `newacct:extlink:${target}:${userId}`;
}

/** 신규 계정 + 외부 링크 포함 시 강화 레이트리밋 — 통과 시 null */
export async function assertNewAccountExternalLinkRateLimit(
  user: User,
  target: ContentTarget,
  html: string,
): Promise<string | null> {
  if (!shouldApplyNewAccountLinkPolicy(user.createdAt, isAdmin(user))) {
    return null;
  }
  if (!hasExternalLinks(html)) {
    return null;
  }

  const isPost = target === "post";
  const result = await checkRateLimit({
    key: rateLimitKey(user.id, target),
    limit: isPost
      ? NEW_ACCOUNT_EXTERNAL_LINK_POST_LIMIT
      : NEW_ACCOUNT_EXTERNAL_LINK_COMMENT_LIMIT,
    windowSeconds: isPost
      ? NEW_ACCOUNT_EXTERNAL_LINK_POST_WINDOW_SECONDS
      : NEW_ACCOUNT_EXTERNAL_LINK_COMMENT_WINDOW_SECONDS,
  });

  if (!result.ok) {
    return rateLimitErrorMessage(result.retryAfterSeconds) ?? NEW_ACCOUNT_EXTERNAL_LINK_RATE_LIMIT_MESSAGE;
  }

  return null;
}

/** 신규 계정 외부 링크 콘텐츠 — 관리자 신고함에 시스템 검토 건 등록 */
export async function enqueueNewAccountLinkReview(options: {
  user: User;
  target: ContentTarget;
  postId: string;
  commentId?: string;
}): Promise<void> {
  const { user, target, postId, commentId } = options;

  if (!shouldApplyNewAccountLinkPolicy(user.createdAt, isAdmin(user))) {
    return;
  }

  const ageDays = newAccountAgeDays(user.createdAt);
  const detail = `${SYSTEM_REPORT_DETAIL_PREFIX} — 가입 ${ageDays}일차, @${user.username}`;

  const duplicateConditions = [
    eq(reports.source, "system"),
    eq(reports.status, "pending"),
    eq(reports.targetType, target),
    eq(reports.postId, postId),
  ];

  if (target === "comment" && commentId) {
    duplicateConditions.push(eq(reports.commentId, commentId));
  }

  const [existing] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(and(...duplicateConditions))
    .limit(1);

  if (existing) return;

  await db.insert(reports).values({
    source: "system",
    reporterId: null,
    targetType: target,
    postId,
    commentId: commentId ?? null,
    reason: "spam",
    detail,
  });

  logger.info("moderation: system report queued for new account external links", {
    userId: user.id,
    username: user.username,
    target,
    postId,
    commentId,
  });
}

/** 저장 전 검사 — 외부 링크 없으면 스킵 */
export async function guardNewAccountExternalLinks(
  user: User,
  target: ContentTarget,
  html: string,
): Promise<string | null> {
  if (!hasExternalLinks(html)) return null;
  return assertNewAccountExternalLinkRateLimit(user, target, html);
}

/** 저장 후 검토 대기 등록 */
export async function afterContentSavedWithExternalLinks(options: {
  user: User;
  target: ContentTarget;
  html: string;
  postId: string;
  commentId?: string;
}): Promise<void> {
  if (!hasExternalLinks(options.html)) return;
  await enqueueNewAccountLinkReview(options);
}
