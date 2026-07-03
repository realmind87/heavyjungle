"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth/permissions";
import { db } from "@/server/db";
import { blocks, follows, users } from "@/server/db/schema";

const blockUserSchema = z.object({
  targetUserId: z.uuid(),
});

export type BlockActionResult = {
  error?: string;
  blocked?: boolean;
};

/** 사용자 차단 — 양방향 팔로우 관계 제거 */
export async function blockUser(targetUserId: string): Promise<BlockActionResult> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const parsed = blockUserSchema.safeParse({ targetUserId });
  if (!parsed.success) {
    return { error: "잘못된 요청입니다." };
  }

  if (user.id === targetUserId) {
    return { error: "자기 자신은 차단할 수 없습니다." };
  }

  const [target] = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!target) {
    return { error: "사용자를 찾을 수 없습니다." };
  }

  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ blockerId: blocks.blockerId })
        .from(blocks)
        .where(and(eq(blocks.blockerId, user.id), eq(blocks.blockedId, targetUserId)))
        .limit(1);

      if (!existing) {
        await tx.insert(blocks).values({
          blockerId: user.id,
          blockedId: targetUserId,
        });
      }

      // 양방향 팔로우 해제
      await tx
        .delete(follows)
        .where(
          or(
            and(eq(follows.followerId, user.id), eq(follows.followingId, targetUserId)),
            and(eq(follows.followerId, targetUserId), eq(follows.followingId, user.id)),
          ),
        );
    });

    revalidatePath(`/u/${target.username}`);
    revalidatePath(`/u/${user.username}`);
    revalidatePath(`/u/${target.username}/followers`);
    revalidatePath(`/u/${target.username}/following`);
    revalidatePath(`/u/${user.username}/followers`);
    revalidatePath(`/u/${user.username}/following`);
    revalidatePath("/");

    return { blocked: true };
  } catch {
    return { error: "차단 처리에 실패했습니다." };
  }
}

/** 차단 해제 */
export async function unblockUser(targetUserId: string): Promise<BlockActionResult> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const parsed = blockUserSchema.safeParse({ targetUserId });
  if (!parsed.success) {
    return { error: "잘못된 요청입니다." };
  }

  const [target] = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!target) {
    return { error: "사용자를 찾을 수 없습니다." };
  }

  try {
    await db
      .delete(blocks)
      .where(and(eq(blocks.blockerId, user.id), eq(blocks.blockedId, targetUserId)));

    revalidatePath(`/u/${target.username}`);
    revalidatePath(`/u/${user.username}`);
    revalidatePath("/");

    return { blocked: false };
  } catch {
    return { error: "차단 해제에 실패했습니다." };
  }
}
