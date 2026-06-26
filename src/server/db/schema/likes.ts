import { pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { posts } from "./posts";
import { users } from "./users";

/** 글 좋아요 — 유저당 글 하나만 가능 */
export const likes = pgTable(
  "likes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.postId] })],
);

export type Like = typeof likes.$inferSelect;
export type NewLike = typeof likes.$inferInsert;
