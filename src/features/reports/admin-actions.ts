"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logAdminAction } from "@/features/admin/audit-log";
import { createNotification } from "@/features/notifications/create";
import { resolveReportSchema } from "@/features/reports/validators";
import { requireAdminUser } from "@/server/auth/permissions";
import { db } from "@/server/db";
import { comments, posts, reports } from "@/server/db/schema";

export type ReportAdminActionState = {
  error?: string;
};

async function getReportOrError(reportId: string) {
  const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  return report;
}

/** 신고 기각 — 조치 없이 종료 */
export async function dismissReport(
  _prevState: ReportAdminActionState,
  formData: FormData,
): Promise<ReportAdminActionState> {
  const user = await requireAdminUser();
  if (!user) {
    return { error: "관리자 권한이 필요합니다." };
  }

  const parsed = resolveReportSchema.safeParse({ reportId: formData.get("reportId") });
  if (!parsed.success) {
    return { error: "유효하지 않은 요청입니다." };
  }

  const report = await getReportOrError(parsed.data.reportId);
  if (!report) {
    return { error: "신고 내역을 찾을 수 없습니다." };
  }
  if (report.status !== "pending") {
    return { error: "이미 처리된 신고입니다." };
  }

  await db
    .update(reports)
    .set({ status: "dismissed", resolvedById: user.id, resolvedAt: new Date() })
    .where(eq(reports.id, report.id));

  await logAdminAction({
    actorId: user.id,
    action: "report_dismiss",
    targetId: report.id,
    targetLabel: report.targetType === "post" ? "글 신고" : "댓글 신고",
  });

  await createNotification({
    recipientId: report.reporterId,
    actorId: user.id,
    type: "report_dismissed",
    postId: report.postId ?? undefined,
  });

  revalidatePath("/admin");
  return {};
}

/** 신고 승인 처리 — 대상 글/댓글을 삭제하고 신고를 해결 상태로 전환 */
export async function resolveReportAndRemoveTarget(
  _prevState: ReportAdminActionState,
  formData: FormData,
): Promise<ReportAdminActionState> {
  const user = await requireAdminUser();
  if (!user) {
    return { error: "관리자 권한이 필요합니다." };
  }

  const parsed = resolveReportSchema.safeParse({ reportId: formData.get("reportId") });
  if (!parsed.success) {
    return { error: "유효하지 않은 요청입니다." };
  }

  const report = await getReportOrError(parsed.data.reportId);
  if (!report) {
    return { error: "신고 내역을 찾을 수 없습니다." };
  }
  if (report.status !== "pending") {
    return { error: "이미 처리된 신고입니다." };
  }

  if (report.targetType === "post" && report.postId) {
    await db.update(posts).set({ isDeleted: true }).where(eq(posts.id, report.postId));
  } else if (report.targetType === "comment" && report.commentId) {
    const targetCommentId = report.commentId;
    await db.transaction(async (tx) => {
      const [comment] = await tx
        .select({ id: comments.id, postId: comments.postId })
        .from(comments)
        .where(eq(comments.id, targetCommentId))
        .limit(1);

      if (comment) {
        await tx.update(comments).set({ isDeleted: true }).where(eq(comments.id, comment.id));
        await tx
          .update(posts)
          .set({ commentCount: sql`GREATEST(comment_count - 1, 0)` })
          .where(eq(posts.id, comment.postId));
      }
    });
  }

  await db
    .update(reports)
    .set({ status: "resolved", resolvedById: user.id, resolvedAt: new Date() })
    .where(eq(reports.id, report.id));

  await logAdminAction({
    actorId: user.id,
    action: "report_resolve",
    targetId: report.targetType === "post" ? report.postId ?? undefined : report.commentId ?? undefined,
    targetLabel: report.targetType === "post" ? "글 삭제 (신고 처리)" : "댓글 삭제 (신고 처리)",
    metadata: { reportId: report.id },
  });

  await createNotification({
    recipientId: report.reporterId,
    actorId: user.id,
    type: "report_resolved",
    postId: report.postId ?? undefined,
  });

  revalidatePath("/admin");
  revalidatePath("/");
  if (report.postId) revalidatePath(`/posts/${report.postId}`);
  return {};
}
