"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isEitherBlocked } from "@/features/blocks/queries";
import { requireUser } from "@/server/auth/permissions";
import { db } from "@/server/db";
import { follows, users } from "@/server/db/schema";

const toggleFollowSchema = z.object({
  targetUserId: z.uuid(),
});

export type ToggleFollowResult = {
  error?: string;
  following?: boolean;
  followerCount?: number;
};

/** 팔로우 토글 — 본인 팔로우 불가 */
export async function toggleFollow(targetUserId: string): Promise<ToggleFollowResult> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const parsed = toggleFollowSchema.safeParse({ targetUserId });
  if (!parsed.success) {
    return { error: "잘못된 요청입니다." };
  }

  if (user.id === targetUserId) {
    return { error: "자기 자신은 팔로우할 수 없습니다." };
  }

  const [target] = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!target) {
    return { error: "사용자를 찾을 수 없습니다." };
  }

  if (await isEitherBlocked(user.id, targetUserId)) {
    return { error: "차단된 사용자와는 팔로우할 수 없습니다." };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ followerId: follows.followerId })
        .from(follows)
        .where(and(eq(follows.followerId, user.id), eq(follows.followingId, targetUserId)))
        .limit(1);

      if (existing) {
        await tx
          .delete(follows)
          .where(and(eq(follows.followerId, user.id), eq(follows.followingId, targetUserId)));
      } else {
        await tx.insert(follows).values({
          followerId: user.id,
          followingId: targetUserId,
        });
      }

      const [countRow] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(follows)
        .where(eq(follows.followingId, targetUserId));

      return {
        following: !existing,
        followerCount: countRow?.count ?? 0,
      };
    });

    revalidatePath(`/u/${target.username}`);
    revalidatePath(`/u/${user.username}`);
    revalidatePath(`/u/${target.username}/followers`);
    revalidatePath(`/u/${target.username}/following`);
    revalidatePath(`/u/${user.username}/followers`);
    revalidatePath(`/u/${user.username}/following`);

    return result;
  } catch {
    return { error: "팔로우 처리에 실패했습니다." };
  }
}
