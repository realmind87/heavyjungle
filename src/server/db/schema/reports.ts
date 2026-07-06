import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { comments } from "./comments";
import { posts } from "./posts";
import { users } from "./users";

export const reportTargetTypeEnum = pgEnum("report_target_type", ["post", "comment"]);
export const reportReasonEnum = pgEnum("report_reason", ["spam", "abuse", "illegal", "other"]);
export const reportStatusEnum = pgEnum("report_status", ["pending", "resolved", "dismissed"]);
export const reportSourceEnum = pgEnum("report_source", ["user", "system"]);

/** 글·댓글 신고 — 관리자가 검토 후 삭제 처리 또는 기각 */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: reportSourceEnum("source").notNull().default("user"),
    reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "cascade" }),
    targetType: reportTargetTypeEnum("target_type").notNull(),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
    commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
    reason: reportReasonEnum("reason").notNull(),
    detail: text("detail"),
    status: reportStatusEnum("status").notNull().default("pending"),
    resolvedById: uuid("resolved_by_id").references(() => users.id, { onDelete: "set null" }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("reports_status_created_at_idx").on(table.status, table.createdAt)],
);

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
