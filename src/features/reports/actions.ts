"use server";

import { and, eq } from "drizzle-orm";
import { getPostById } from "@/features/posts/queries";
import { reportCommentSchema, reportPostSchema } from "@/features/reports/validators";
import { checkRateLimits, getClientIp, rateLimitErrorMessage } from "@/server/rate-limit";
import { requireUser } from "@/server/auth/permissions";
import { db } from "@/server/db";
import { comments, reports } from "@/server/db/schema";

export type ReportActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

async function assertReportRateLimit(userId: string): Promise<string | null> {
  const ip = await getClientIp();
  const rateLimit = await checkRateLimits([
    { key: `report:ip:${ip}`, limit: 20, windowSeconds: 60 * 60 },
    { key: `report:user:${userId}`, limit: 10, windowSeconds: 60 * 60 },
  ]);
  if (!rateLimit.ok) {
    return rateLimitErrorMessage(rateLimit.retryAfterSeconds);
  }
  return null;
}

export async function reportPost(
  _prevState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const parsed = reportPostSchema.safeParse({
    postId: formData.get("postId"),
    reason: formData.get("reason"),
    detail: formData.get("detail") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { postId, reason, detail } = parsed.data;

  const limited = await assertReportRateLimit(user.id);
  if (limited) return { error: limited };

  const post = await getPostById(postId);
  if (!post || post.isDeleted) {
    return { error: "글을 찾을 수 없습니다." };
  }

  if (post.author.id === user.id) {
    return { error: "자신의 글은 신고할 수 없습니다." };
  }

  const [existing] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(eq(reports.reporterId, user.id), eq(reports.postId, postId), eq(reports.status, "pending")),
    )
    .limit(1);

  if (existing) {
    return { error: "이미 신고한 글입니다. 검토 중입니다." };
  }

  await db.insert(reports).values({
    reporterId: user.id,
    targetType: "post",
    postId,
    reason,
    detail: detail ?? null,
  });

  return { success: true, message: "신고가 접수되었습니다." };
}

export async function reportComment(
  _prevState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const parsed = reportCommentSchema.safeParse({
    commentId: formData.get("commentId"),
    reason: formData.get("reason"),
    detail: formData.get("detail") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { commentId, reason, detail } = parsed.data;

  const limited = await assertReportRateLimit(user.id);
  if (limited) return { error: limited };

  const [comment] = await db
    .select({ id: comments.id, postId: comments.postId, authorId: comments.authorId, isDeleted: comments.isDeleted })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (!comment || comment.isDeleted) {
    return { error: "댓글을 찾을 수 없습니다." };
  }

  if (comment.authorId === user.id) {
    return { error: "자신의 댓글은 신고할 수 없습니다." };
  }

  const [existing] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(
        eq(reports.reporterId, user.id),
        eq(reports.commentId, commentId),
        eq(reports.status, "pending"),
      ),
    )
    .limit(1);

  if (existing) {
    return { error: "이미 신고한 댓글입니다. 검토 중입니다." };
  }

  await db.insert(reports).values({
    reporterId: user.id,
    targetType: "comment",
    postId: comment.postId,
    commentId,
    reason,
    detail: detail ?? null,
  });

  return { success: true, message: "신고가 접수되었습니다." };
}
