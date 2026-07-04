import { pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { comments } from "./comments";
import { users } from "./users";

/** 댓글 좋아요 — 유저당 댓글 하나만 가능 */
export const commentLikes = pgTable(
  "comment_likes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    commentId: uuid("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.commentId] })],
);

export type CommentLike = typeof commentLikes.$inferSelect;
export type NewCommentLike = typeof commentLikes.$inferInsert;
