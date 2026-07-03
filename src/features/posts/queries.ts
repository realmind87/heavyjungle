/**
 * 글 조회 쿼리 (읽기 전용).
 */
import "server-only";

import { and, asc, desc, eq, gt, inArray, lt, notInArray, or, type SQL } from "drizzle-orm";
import { getHiddenUserIdsForViewer } from "@/features/blocks/queries";
import { getFollowingUserIds } from "@/features/follows/queries";
import type { CursorPage } from "@/lib/cursor";
import type { PostListFeed } from "@/features/posts/post-list-state";
import { postListQuerySchema } from "@/features/posts/validators";
import {
  decodePostCursor,
  encodePostCursor,
  type PostCursor,
  type PostSort,
} from "@/features/posts/post-sort";
import { extractPostCoverMedia, type PostCoverType } from "@/lib/post-cover-image";
import { resolveStoragePublicUrl } from "@/lib/storage-url";
import { db } from "@/server/db";
import { posts, users } from "@/server/db/schema";

export type PostListItem = {
  id: string;
  title: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  coverType: PostCoverType | null;
  coverImageUrl: string | null;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

type PostRow = {
  id: string;
  title: string;
  content: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
};

const postListSelect = {
  id: posts.id,
  title: posts.title,
  content: posts.content,
  viewCount: posts.viewCount,
  likeCount: posts.likeCount,
  commentCount: posts.commentCount,
  createdAt: posts.createdAt,
  authorId: users.id,
  authorUsername: users.username,
  authorDisplayName: users.displayName,
  authorAvatarUrl: users.avatarUrl,
};

function mapPostListItem(row: PostRow): PostListItem {
  const cover = extractPostCoverMedia(row.content);
  return {
    id: row.id,
    title: row.title,
    viewCount: row.viewCount,
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    createdAt: row.createdAt,
    coverType: cover?.type ?? null,
    coverImageUrl: resolveStoragePublicUrl(cover?.previewUrl),
    author: {
      id: row.authorId,
      username: row.authorUsername,
      displayName: row.authorDisplayName,
      avatarUrl: resolveStoragePublicUrl(row.authorAvatarUrl),
    },
  };
}

function buildLatestCursorFilter(cursor: Extract<PostCursor, { sort: "latest" }> | null) {
  if (!cursor) return undefined;
  return or(
    lt(posts.createdAt, new Date(cursor.createdAt)),
    and(eq(posts.createdAt, new Date(cursor.createdAt)), lt(posts.id, cursor.id)),
  );
}

function buildPopularCursorFilter(cursor: Extract<PostCursor, { sort: "popular" }> | null) {
  if (!cursor) return undefined;
  return or(
    lt(posts.likeCount, cursor.likeCount),
    and(eq(posts.likeCount, cursor.likeCount), lt(posts.id, cursor.id)),
  );
}

function buildOldestCursorFilter(cursor: Extract<PostCursor, { sort: "oldest" }> | null) {
  if (!cursor) return undefined;
  return or(
    gt(posts.createdAt, new Date(cursor.createdAt)),
    and(eq(posts.createdAt, new Date(cursor.createdAt)), gt(posts.id, cursor.id)),
  );
}

function buildCursorPageForSort(rows: PostRow[], limit: number, sort: PostSort): CursorPage<PostListItem> {
  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const items = slice.map(mapPostListItem);
  const last = slice[slice.length - 1];

  let nextCursor: string | null = null;
  if (hasMore && last) {
    let cursor: PostCursor;
    if (sort === "popular") {
      cursor = { sort: "popular", likeCount: last.likeCount, id: last.id };
    } else if (sort === "oldest") {
      cursor = { sort: "oldest", createdAt: last.createdAt.toISOString(), id: last.id };
    } else {
      cursor = { sort: "latest", createdAt: last.createdAt.toISOString(), id: last.id };
    }
    nextCursor = encodePostCursor(cursor);
  }

  return { items, nextCursor, hasMore };
}

async function fetchPostRows(
  sort: PostSort,
  cursor: PostCursor | null,
  limit: number,
  options: {
    hiddenAuthorIds?: string[];
    authorIds?: string[];
    /** 기본: 일반 게시글만 (공지는 aside 전용) */
    category?: "general" | "notice";
  } = {},
) {
  const filters: SQL[] = [eq(posts.isDeleted, false)];
  filters.push(eq(posts.category, options.category ?? "general"));
  if (options.hiddenAuthorIds && options.hiddenAuthorIds.length > 0) {
    filters.push(notInArray(posts.authorId, options.hiddenAuthorIds));
  }
  if (options.authorIds) {
    filters.push(inArray(posts.authorId, options.authorIds));
  }

  if (sort === "popular") {
    const popularCursor = cursor?.sort === "popular" ? cursor : null;
    const cursorFilter = buildPopularCursorFilter(popularCursor);
    if (cursorFilter) filters.push(cursorFilter);

    return db
      .select(postListSelect)
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(...filters))
      .orderBy(desc(posts.likeCount), desc(posts.id))
      .limit(limit + 1);
  }

  if (sort === "oldest") {
    const oldestCursor = cursor?.sort === "oldest" ? cursor : null;
    const cursorFilter = buildOldestCursorFilter(oldestCursor);
    if (cursorFilter) filters.push(cursorFilter);

    return db
      .select(postListSelect)
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(...filters))
      .orderBy(asc(posts.createdAt), asc(posts.id))
      .limit(limit + 1);
  }

  const latestCursor = cursor?.sort === "latest" ? cursor : null;
  const cursorFilter = buildLatestCursorFilter(latestCursor);
  if (cursorFilter) filters.push(cursorFilter);

  return db
    .select(postListSelect)
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(...filters))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit + 1);
}

/** 홈 글 목록 — 정렬·커서 페이지네이션 (차단 사용자 글 제외, 팔로우 피드 지원) */
export async function listPosts(
  options: {
    cursor?: string;
    limit?: number;
    sort?: PostSort;
    feed?: PostListFeed;
    viewerId?: string;
  } = {},
): Promise<CursorPage<PostListItem>> {
  const { cursor: rawCursor, limit, sort } = postListQuerySchema.parse(options);
  const cursor = decodePostCursor(rawCursor, sort);
  const feed = options.feed ?? "all";

  if (feed === "following") {
    if (!options.viewerId) {
      return { items: [], nextCursor: null, hasMore: false };
    }

    const followingIds = await getFollowingUserIds(options.viewerId);
    if (followingIds.length === 0) {
      return { items: [], nextCursor: null, hasMore: false };
    }

    const hiddenAuthorIds = await getHiddenUserIdsForViewer(options.viewerId);
    const authorIds = followingIds.filter((id) => !hiddenAuthorIds.includes(id));
    if (authorIds.length === 0) {
      return { items: [], nextCursor: null, hasMore: false };
    }

    const rows = await fetchPostRows(sort, cursor, limit, { authorIds });
    return buildCursorPageForSort(rows, limit, sort);
  }

  const hiddenAuthorIds = options.viewerId
    ? await getHiddenUserIdsForViewer(options.viewerId)
    : [];
  const rows = await fetchPostRows(sort, cursor, limit, { hiddenAuthorIds });

  return buildCursorPageForSort(rows, limit, sort);
}

/** @deprecated listPosts 사용 */
export async function listRecentPosts(
  options: { cursor?: string; limit?: number } = {},
): Promise<CursorPage<PostListItem>> {
  return listPosts({ ...options, sort: "latest" });
}

export async function getPostById(id: string) {
  const [row] = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      category: posts.category,
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
    category: row.category,
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

export type NoticeListItem = {
  id: string;
  title: string;
  createdAt: Date;
};

/** 홈 aside 공지사항 — 최신순 최대 limit개 */
export async function listNotices(limit = 5): Promise<NoticeListItem[]> {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(and(eq(posts.isDeleted, false), eq(posts.category, "notice")))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit);
}

/** 공지사항 게시판 목록 — 최신순 커서 페이지네이션 */
export async function listNoticePosts(
  options: { cursor?: string; limit?: number } = {},
): Promise<CursorPage<PostListItem>> {
  const { cursor: rawCursor, limit } = postListQuerySchema.parse({
    ...options,
    sort: "latest",
  });
  const cursor = decodePostCursor(rawCursor, "latest");
  const rows = await fetchPostRows("latest", cursor, limit, { category: "notice" });
  return buildCursorPageForSort(rows, limit, "latest");
}
