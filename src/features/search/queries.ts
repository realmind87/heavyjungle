/**
 * 검색 조회 쿼리 (읽기 전용).
 */
import "server-only";

import { and, desc, eq, ilike, notInArray, or, sql } from "drizzle-orm";
import { getHiddenUserIdsForViewer } from "@/features/blocks/queries";
import type { SearchPost, SearchUser } from "@/features/search/types";
import { resolveStoragePublicUrl } from "@/lib/storage-url";
import { db } from "@/server/db";
import { posts, users } from "@/server/db/schema";

const SEARCH_LIMIT = 8;
const EXCERPT_RADIUS = 40;

function escapeLikePattern(value: string) {
  return value.replace(/[%_\\]/g, "\\$&");
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 검색어 주변 문맥을 잘라 미리보기 텍스트 생성 */
function buildExcerpt(plainText: string, query: string): string {
  const lower = plainText.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());

  if (idx < 0) {
    return plainText.length > EXCERPT_RADIUS * 2 ? `${plainText.slice(0, EXCERPT_RADIUS * 2)}…` : plainText;
  }

  const start = Math.max(0, idx - EXCERPT_RADIUS);
  const end = Math.min(plainText.length, idx + query.length + EXCERPT_RADIUS);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < plainText.length ? "…" : "";
  return `${prefix}${plainText.slice(start, end)}${suffix}`;
}

export type SearchPostsPage = {
  items: SearchPost[];
  hasMore: boolean;
};

export type SearchUsersPage = {
  items: SearchUser[];
  hasMore: boolean;
};

/** 게시글 제목·본문 부분 일치 검색 (차단 관계인 작성자의 글은 제외) */
export async function searchPosts(
  query: string,
  viewerId?: string,
  options: { limit?: number; offset?: number } = {},
): Promise<SearchPostsPage> {
  const q = query.trim();
  if (!q) return { items: [], hasMore: false };

  const pattern = `%${escapeLikePattern(q)}%`;
  const hiddenAuthorIds = viewerId ? await getHiddenUserIdsForViewer(viewerId) : [];
  const limit = options.limit ?? SEARCH_LIMIT;
  const offset = options.offset ?? 0;

  const filters = [
    and(
      eq(posts.isDeleted, false),
      or(ilike(posts.title, pattern), sql`regexp_replace(${posts.content}, '<[^>]+>', ' ', 'g') ILIKE ${pattern}`),
    ),
  ];
  if (hiddenAuthorIds.length > 0) {
    filters.push(notInArray(posts.authorId, hiddenAuthorIds));
  }

  const plainContent = sql`regexp_replace(${posts.content}, '<[^>]+>', ' ', 'g')`;
  const relevance = sql`GREATEST(similarity(${posts.title}, ${q}), similarity(${plainContent}, ${q}))`;

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      createdAt: posts.createdAt,
      authorUsername: users.username,
      authorDisplayName: users.displayName,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(...filters))
    .orderBy(desc(relevance), desc(posts.createdAt), desc(posts.id))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map((row) => {
      const titleMatches = row.title.toLowerCase().includes(q.toLowerCase());
      return {
        id: row.id,
        title: row.title,
        createdAt: row.createdAt.toISOString(),
        author: {
          username: row.authorUsername,
          displayName: row.authorDisplayName,
        },
        excerpt: titleMatches ? undefined : buildExcerpt(stripHtml(row.content), q),
      };
    }),
    hasMore,
  };
}

/** @deprecated searchPosts 사용 — 드롭다운 자동완성용 하위 호환 */
export async function searchPostsByTitle(query: string, viewerId?: string): Promise<SearchPost[]> {
  const { items } = await searchPosts(query, viewerId);
  return items;
}

/** 유저 닉네임/아이디 부분 일치 검색 (차단 관계인 사용자는 제외) */
export async function searchUsers(
  query: string,
  viewerId?: string,
  options: { limit?: number; offset?: number } = {},
): Promise<SearchUsersPage> {
  const q = query.trim().replace(/^@+/, "");
  if (!q) return { items: [], hasMore: false };

  const pattern = `%${escapeLikePattern(q)}%`;
  const hiddenUserIds = viewerId ? await getHiddenUserIdsForViewer(viewerId) : [];
  const limit = options.limit ?? SEARCH_LIMIT;
  const offset = options.offset ?? 0;

  const filters = [or(ilike(users.username, pattern), ilike(users.displayName, pattern))];
  if (hiddenUserIds.length > 0) {
    filters.push(notInArray(users.id, hiddenUserIds));
  }

  const relevance = sql`GREATEST(similarity(${users.username}, ${q}), similarity(COALESCE(${users.displayName}, ''), ${q}))`;

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(and(...filters))
    .orderBy(desc(relevance), users.username)
    .limit(limit + 1)
    .offset(offset);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map((row) => ({
      id: row.id,
      username: row.username,
      displayName: row.displayName,
      avatarUrl: resolveStoragePublicUrl(row.avatarUrl),
    })),
    hasMore,
  };
}

/** @deprecated searchUsers 사용 — 드롭다운 자동완성용 하위 호환 */
export async function searchUsersByQuery(query: string, viewerId?: string): Promise<SearchUser[]> {
  const { items } = await searchUsers(query, viewerId);
  return items;
}
