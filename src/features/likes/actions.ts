"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { isEitherBlocked } from "@/features/blocks/queries";
import { getPostById } from "@/features/posts/queries";
import { requireUser } from "@/server/auth/permissions";
import { db } from "@/server/db";
import { likes, posts } from "@/server/db/schema";

const toggleLikeSchema = z.object({
  postId: z.uuid(),
});

export type ToggleLikeResult = {
  error?: string;
  liked?: boolean;
  likeCount?: number;
};

/** 글 좋아요 토글 — 트랜잭션으로 likes + posts.likeCount 원자적 증감 */
export async function toggleLike(postId: string): Promise<ToggleLikeResult> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const parsed = toggleLikeSchema.safeParse({ postId });
  if (!parsed.success) {
    return { error: "잘못된 요청입니다." };
  }

  const post = await getPostById(postId);
  if (!post || post.isDeleted) {
    return { error: "글을 찾을 수 없습니다." };
  }

  if (await isEitherBlocked(user.id, post.author.id)) {
    return { error: "차단된 사용자의 글에는 좋아요할 수 없습니다." };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ userId: likes.userId })
        .from(likes)
        .where(and(eq(likes.userId, user.id), eq(likes.postId, postId)))
        .limit(1);

      if (existing) {
        await tx.delete(likes).where(and(eq(likes.userId, user.id), eq(likes.postId, postId)));
        await tx
          .update(posts)
          .set({ likeCount: sql`GREATEST(like_count - 1, 0)` })
          .where(eq(posts.id, postId));
      } else {
        await tx.insert(likes).values({ userId: user.id, postId });
        await tx
          .update(posts)
          .set({ likeCount: sql`like_count + 1` })
          .where(eq(posts.id, postId));
      }

      const [updated] = await tx
        .select({ likeCount: posts.likeCount })
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      return {
        liked: !existing,
        likeCount: updated?.likeCount ?? post.likeCount,
      };
    });

    return result;
  } catch {
    return { error: "좋아요 처리에 실패했습니다." };
  }
}
