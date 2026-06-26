/**
 * 글 조회 쿼리 (읽기 전용).
 */
import "server-only";

import { and, desc, eq, lt, or } from "drizzle-orm";
import { buildCursorPage, decodeCursor } from "@/lib/cursor";
import type { CursorPage } from "@/lib/cursor";
import { postListQuerySchema } from "@/features/posts/validators";
import { db } from "@/server/db";
import { posts, users } from "@/server/db/schema";

export type PostListItem = {
  id: string;
  title: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  author: {
    id: string;
    username: string;
  };
};

async function fetchPostRows(
  whereClause: ReturnType<typeof and> | ReturnType<typeof eq> | undefined,
  limit: number,
) {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      viewCount: posts.viewCount,
      likeCount: posts.likeCount,
      commentCount: posts.commentCount,
      createdAt: posts.createdAt,
      authorId: users.id,
      authorUsername: users.username,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(whereClause)
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit + 1);
}

function mapPostListItem(
  row: Awaited<ReturnType<typeof fetchPostRows>>[number],
): PostListItem {
  return {
    id: row.id,
    title: row.title,
    viewCount: row.viewCount,
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    createdAt: row.createdAt,
    author: { id: row.authorId, username: row.authorUsername },
  };
}

function buildCursorFilter(cursor: ReturnType<typeof decodeCursor>) {
  if (!cursor) return undefined;
  return or(
    lt(posts.createdAt, new Date(cursor.createdAt)),
    and(eq(posts.createdAt, new Date(cursor.createdAt)), lt(posts.id, cursor.id)),
  );
}

/** 홈 — 최신글 */
export async function listRecentPosts(
  options: { cursor?: string; limit?: number } = {},
): Promise<CursorPage<PostListItem>> {
  const { cursor: rawCursor, limit } = postListQuerySchema.parse(options);
  const cursor = decodeCursor(rawCursor);

  const rows = await fetchPostRows(
    and(eq(posts.isDeleted, false), buildCursorFilter(cursor)),
    limit,
  );

  return buildCursorPage(rows.map(mapPostListItem), limit);
}

export async function getPostById(id: string) {
  const [row] = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      viewCount: posts.viewCount,
      likeCount: posts.likeCount,
      commentCount: posts.commentCount,
      isDeleted: posts.isDeleted,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorId: users.id,
      authorUsername: users.username,
      authorDisplayName: users.displayName,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, id))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    viewCount: row.viewCount,
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: {
      id: row.authorId,
      username: row.authorUsername,
      displayName: row.authorDisplayName,
      avatarUrl: row.authorAvatarUrl,
    },
  };
}
