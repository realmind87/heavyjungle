import { type AnyPgColumn, boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { posts } from "./posts";
import { users } from "./users";

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    /**
     * null이면 최상위 댓글, 값이 있으면 해당 댓글의 답글 (무한 중첩).
     */
    parentId: uuid("parent_id").references((): AnyPgColumn => comments.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    /** 좋아요 수 캐시 — comment_likes 집계 대신 렌더에 사용 */
    likeCount: integer("like_count").notNull().default(0),
    /** soft delete — 내용만 숨기고 스레드 구조는 유지 */
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("comments_post_created_at_idx").on(table.postId, table.createdAt)],
);

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
