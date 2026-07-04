import { boolean, index, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { comments } from "./comments";
import { posts } from "./posts";
import { users } from "./users";

/**
 * follow: 팔로우 받음 | comment: 내 글에 댓글 | reply: 내 댓글에 답글 | like: 내 글에 좋아요 | comment_like: 내 댓글에 좋아요
 * report_resolved: 내 신고가 조치됨 | report_dismissed: 내 신고가 기각됨 (시스템 알림)
 */
export const notificationTypeEnum = pgEnum("notification_type", [
  "follow",
  "comment",
  "reply",
  "like",
  "comment_like",
  "report_resolved",
  "report_dismissed",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** 알림을 받는 사용자 */
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** 알림을 발생시킨 사용자 */
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
    commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("notifications_recipient_created_at_idx").on(table.recipientId, table.createdAt)],
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
