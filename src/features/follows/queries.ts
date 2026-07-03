/**
 * 팔로우 조회 쿼리 (읽기 전용).
 */
import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import type { FollowUserSummary } from "@/features/follows/types";
import { resolveStoragePublicUrl } from "@/lib/storage-url";
import { db } from "@/server/db";
import { follows, users } from "@/server/db/schema";

export type { FollowUserSummary } from "@/features/follows/types";

export type FollowStats = {
  followerCount: number;
  followingCount: number;
};

/** 팔로워·팔로잉 수 */
export async function getFollowStats(userId: string): Promise<FollowStats> {
  const [[followers], [following]] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.followingId, userId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.followerId, userId)),
  ]);

  return {
    followerCount: followers?.count ?? 0,
    followingCount: following?.count ?? 0,
  };
}

/** viewer가 팔로우 중인 사용자 ID 목록 */
export async function getFollowingUserIds(viewerId: string): Promise<string[]> {
  const rows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, viewerId));

  return rows.map((row) => row.followingId);
}

/** viewer가 target을 팔로우 중인지 */
export async function isFollowingUser(viewerId: string, targetUserId: string): Promise<boolean> {
  if (viewerId === targetUserId) return false;

  const [row] = await db
    .select({ followerId: follows.followerId })
    .from(follows)
    .where(and(eq(follows.followerId, viewerId), eq(follows.followingId, targetUserId)))
    .limit(1);

  return !!row;
}

/** 팔로워 목록 (나를 팔로우하는 사용자) */
export async function listFollowers(userId: string, limit = 50): Promise<FollowUserSummary[]> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, userId))
    .orderBy(desc(follows.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    avatarUrl: resolveStoragePublicUrl(row.avatarUrl),
  }));
}

/** 팔로잉 목록 (내가 팔로우하는 사용자) */
export async function listFollowing(userId: string, limit = 50): Promise<FollowUserSummary[]> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, userId))
    .orderBy(desc(follows.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    avatarUrl: resolveStoragePublicUrl(row.avatarUrl),
  }));
}
