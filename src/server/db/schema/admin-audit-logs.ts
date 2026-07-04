import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const adminAuditActionEnum = pgEnum("admin_audit_action", [
  "notice_create",
  "notice_update",
  "post_delete",
  "comment_delete",
  "role_change",
  "report_resolve",
  "report_dismiss",
]);

/** 관리자 조치 감사 로그 — 공지 등록·수정, 강제 삭제, 권한 변경 기록 */
export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: adminAuditActionEnum("action").notNull(),
  /** 대상 리소스 ID (post/comment/user) — 삭제되어도 로그는 보존 */
  targetId: uuid("target_id"),
  /** 대상 요약 (제목, 아이디 등) — 삭제 후에도 무엇이었는지 알 수 있도록 스냅샷 */
  targetLabel: text("target_label"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
