import { type AnyPgColumn, boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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
     * null이면 최상위 댓글, 값이 있으면 해당 댓글의 대댓글.
     * 앱 로직상 1단계 대댓글까지만 허용(대댓글에 또 대댓글 불가).
     */
    parentId: uuid("parent_id").references((): AnyPgColumn => comments.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
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
