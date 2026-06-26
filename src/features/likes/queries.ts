/**
 * 좋아요 조회 쿼리.
 */
import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { likes } from "@/server/db/schema";

export async function getUserLikeForPost(userId: string, postId: string): Promise<boolean> {
  const [row] = await db
    .select({ userId: likes.userId })
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
    .limit(1);

  return !!row;
}

/** 목록용 — 여러 글에 대한 현재 유저 좋아요 여부 */
export async function getUserLikesForPosts(
  userId: string,
  postIds: string[],
): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();

  const rows = await db
    .select({ postId: likes.postId })
    .from(likes)
    .where(and(eq(likes.userId, userId), inArray(likes.postId, postIds)));

  return new Set(rows.map((r) => r.postId));
}
