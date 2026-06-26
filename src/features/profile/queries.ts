/**
 * 프로필 조회 쿼리 (읽기 전용).
 */
import "server-only";

import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { buildCursorPage, decodeCursor } from "@/lib/cursor";
import type { CursorPage } from "@/lib/cursor";
import type { PostListItem } from "@/features/posts/queries";
import { userPostsQuerySchema } from "@/features/profile/validators";
import { db } from "@/server/db";
import { posts, users } from "@/server/db/schema";

export type PublicProfile = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  stats: {
    postCount: number;
    likesReceived: number;
  };
};

function buildCursorFilter(cursor: ReturnType<typeof decodeCursor>) {
  if (!cursor) return undefined;
  return or(
    lt(posts.createdAt, new Date(cursor.createdAt)),
    and(eq(posts.createdAt, new Date(cursor.createdAt)), lt(posts.id, cursor.id)),
  );
}

/** username으로 공개 프로필 + 활동 요약 조회 */
export async function getPublicProfileByUsername(username: string): Promise<PublicProfile | null> {
  const [row] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!row) return null;

  const [stats] = await db
    .select({
      postCount: sql<number>`count(*)::int`,
      likesReceived: sql<number>`coalesce(sum(${posts.likeCount}), 0)::int`,
    })
    .from(posts)
    .where(and(eq(posts.authorId, row.id), eq(posts.isDeleted, false)));

  return {
    ...row,
    stats: {
      postCount: stats?.postCount ?? 0,
      likesReceived: stats?.likesReceived ?? 0,
    },
  };
}

/** 사용자 작성 글 목록 (삭제 글 제외, cursor 페이지네이션) */
export async function getUserPosts(
  userId: string,
  options: { cursor?: string; limit?: number } = {},
): Promise<CursorPage<PostListItem>> {
  const { cursor: rawCursor, limit } = userPostsQuerySchema.parse(options);
  const cursor = decodeCursor(rawCursor);

  const rows = await db
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
    .where(
      and(
        eq(posts.authorId, userId),
        eq(posts.isDeleted, false),
        buildCursorFilter(cursor),
      ),
    )
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit + 1);

  const items: PostListItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    viewCount: row.viewCount,
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    createdAt: row.createdAt,
    author: { id: row.authorId, username: row.authorUsername },
  }));

  return buildCursorPage(items, limit);
}
