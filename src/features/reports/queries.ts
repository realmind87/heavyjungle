/**
 * 신고 조회 쿼리 (관리자 전용).
 */
import "server-only";

import { alias } from "drizzle-orm/pg-core";
import { desc, eq, sql } from "drizzle-orm";
import type { ReportReason, ReportSource, ReportStatus, ReportTargetType } from "@/features/reports/types";
import { db } from "@/server/db";
import { comments, posts, reports, users } from "@/server/db/schema";

const REPORT_LIST_LIMIT = 100;

export type AdminReportListItem = {
  id: string;
  source: ReportSource;
  targetType: ReportTargetType;
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
  createdAt: Date;
  reporter: { id: string; username: string } | null;
  post: { id: string; title: string; isDeleted: boolean } | null;
  comment: { id: string; postId: string; content: string; isDeleted: boolean } | null;
};

export async function listReports(): Promise<AdminReportListItem[]> {
  const reporter = alias(users, "reporter");

  const rows = await db
    .select({
      id: reports.id,
      source: reports.source,
      targetType: reports.targetType,
      reason: reports.reason,
      detail: reports.detail,
      status: reports.status,
      createdAt: reports.createdAt,
      reporterId: reporter.id,
      reporterUsername: reporter.username,
      postId: posts.id,
      postTitle: posts.title,
      postIsDeleted: posts.isDeleted,
      commentId: comments.id,
      commentPostId: comments.postId,
      commentContent: comments.content,
      commentIsDeleted: comments.isDeleted,
    })
    .from(reports)
    .leftJoin(reporter, eq(reports.reporterId, reporter.id))
    .leftJoin(posts, eq(reports.postId, posts.id))
    .leftJoin(comments, eq(reports.commentId, comments.id))
    .orderBy(sql`CASE WHEN ${reports.status} = 'pending' THEN 0 ELSE 1 END`, desc(reports.createdAt))
    .limit(REPORT_LIST_LIMIT);

  return rows.map((row) => ({
    id: row.id,
    source: row.source,
    targetType: row.targetType,
    reason: row.reason,
    detail: row.detail,
    status: row.status,
    createdAt: row.createdAt,
    reporter:
      row.reporterId && row.reporterUsername
        ? { id: row.reporterId, username: row.reporterUsername }
        : null,
    post: row.postId ? { id: row.postId, title: row.postTitle ?? "", isDeleted: row.postIsDeleted ?? false } : null,
    comment: row.commentId
      ? {
          id: row.commentId,
          postId: row.commentPostId ?? "",
          content: row.commentContent ?? "",
          isDeleted: row.commentIsDeleted ?? false,
        }
      : null,
  }));
}
