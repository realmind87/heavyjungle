/**
 * 검색 조회 쿼리 (읽기 전용).
 */
import "server-only";

import { and, desc, eq, ilike, or } from "drizzle-orm";
import type { SearchPost, SearchUser } from "@/features/search/types";
import { resolveStoragePublicUrl } from "@/lib/storage-url";
import { db } from "@/server/db";
import { posts, users } from "@/server/db/schema";

const SEARCH_LIMIT = 8;

function escapeLikePattern(value: string) {
  return value.replace(/[%_\\]/g, "\\$&");
}

/** 게시글 제목 부분 일치 검색 */
export async function searchPostsByTitle(query: string): Promise<SearchPost[]> {
  const q = query.trim();
  if (!q) return [];

  const pattern = `%${escapeLikePattern(q)}%`;

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      createdAt: posts.createdAt,
      authorUsername: users.username,
      authorDisplayName: users.displayName,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.isDeleted, false), ilike(posts.title, pattern)))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(SEARCH_LIMIT);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    author: {
      username: row.authorUsername,
      displayName: row.authorDisplayName,
    },
  }));
}

/** 유저 닉네임/아이디 부분 일치 검색 */
export async function searchUsersByQuery(query: string): Promise<SearchUser[]> {
  const q = query.trim().replace(/^@+/, "");
  if (!q) return [];

  const pattern = `%${escapeLikePattern(q)}%`;

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(or(ilike(users.username, pattern), ilike(users.displayName, pattern)))
    .orderBy(users.username)
    .limit(SEARCH_LIMIT);

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    avatarUrl: resolveStoragePublicUrl(row.avatarUrl),
  }));
}
