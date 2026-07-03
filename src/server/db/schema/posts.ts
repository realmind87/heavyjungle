import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

/** 일반 게시글 | 공지사항 (공지는 관리자만 등록) */
export const postCategoryEnum = pgEnum("post_category", ["general", "notice"]);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    category: postCategoryEnum("category").notNull().default("general"),
    /** 조회수 캐시 — 목록·상세에서 COUNT 없이 빠르게 표시 */
    viewCount: integer("view_count").notNull().default(0),
    /** 좋아요 수 캐시 — likes 집계 대신 카드/목록 렌더에 사용 */
    likeCount: integer("like_count").notNull().default(0),
    /** 댓글 수 캐시 — 목록에서 서브쿼리 없이 표시 */
    commentCount: integer("comment_count").notNull().default(0),
    /** soft delete — 삭제 글도 FK·감사 추적을 위해 행은 유지 */
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("posts_created_at_idx").on(table.createdAt.desc())],
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
