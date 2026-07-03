/**
 * 차단 조회 쿼리 (읽기 전용).
 */
import "server-only";

import { and, desc, eq, or } from "drizzle-orm";
import type { FollowUserSummary } from "@/features/follows/types";
import { resolveStoragePublicUrl } from "@/lib/storage-url";
import { db } from "@/server/db";
import { blocks, users } from "@/server/db/schema";

export type BlockedUserSummary = FollowUserSummary;

export type BlockRelation = {
  /** viewer가 target을 차단함 */
  isBlocking: boolean;
  /** target이 viewer를 차단함 */
  isBlockedBy: boolean;
};

/** 두 사용자 간 차단 관계 */
export async function getBlockRelation(
  viewerId: string,
  targetUserId: string,
): Promise<BlockRelation> {
  if (viewerId === targetUserId) {
    return { isBlocking: false, isBlockedBy: false };
  }

  const rows = await db
    .select({
      blockerId: blocks.blockerId,
      blockedId: blocks.blockedId,
    })
    .from(blocks)
    .where(
      or(
        and(eq(blocks.blockerId, viewerId), eq(blocks.blockedId, targetUserId)),
        and(eq(blocks.blockerId, targetUserId), eq(blocks.blockedId, viewerId)),
      ),
    );

  return {
    isBlocking: rows.some((row) => row.blockerId === viewerId && row.blockedId === targetUserId),
    isBlockedBy: rows.some((row) => row.blockerId === targetUserId && row.blockedId === viewerId),
  };
}

/** 피드 등에서 제외할 사용자 ID (내가 차단 + 나를 차단) */
export async function getHiddenUserIdsForViewer(viewerId: string): Promise<string[]> {
  const rows = await db
    .select({
      blockerId: blocks.blockerId,
      blockedId: blocks.blockedId,
    })
    .from(blocks)
    .where(or(eq(blocks.blockerId, viewerId), eq(blocks.blockedId, viewerId)));

  const ids = new Set<string>();
  for (const row of rows) {
    if (row.blockerId === viewerId) ids.add(row.blockedId);
    if (row.blockedId === viewerId) ids.add(row.blockerId);
  }
  return [...ids];
}

/** 양방향 차단 여부 */
export async function isEitherBlocked(userAId: string, userBId: string): Promise<boolean> {
  if (userAId === userBId) return false;
  const relation = await getBlockRelation(userAId, userBId);
  return relation.isBlocking || relation.isBlockedBy;
}

/** 내가 차단한 사용자 목록 */
export async function listBlockedUsers(blockerId: string, limit = 50): Promise<BlockedUserSummary[]> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(blocks)
    .innerJoin(users, eq(blocks.blockedId, users.id))
    .where(eq(blocks.blockerId, blockerId))
    .orderBy(desc(blocks.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    avatarUrl: resolveStoragePublicUrl(row.avatarUrl),
  }));
}
