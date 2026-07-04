"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { isEitherBlocked } from "@/features/blocks/queries";
import { createNotification } from "@/features/notifications/create";
import { requireUser } from "@/server/auth/permissions";
import { db } from "@/server/db";
import { commentLikes, comments } from "@/server/db/schema";

const toggleCommentLikeSchema = z.object({
  commentId: z.uuid(),
});

export type ToggleCommentLikeResult = {
  error?: string;
  liked?: boolean;
  likeCount?: number;
};

/** 댓글 좋아요 토글 — 트랜잭션으로 comment_likes + comments.like_count 원자적 증감 */
export async function toggleCommentLike(commentId: string): Promise<ToggleCommentLikeResult> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const parsed = toggleCommentLikeSchema.safeParse({ commentId });
  if (!parsed.success) {
    return { error: "잘못된 요청입니다." };
  }

  const [comment] = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      authorId: comments.authorId,
      isDeleted: comments.isDeleted,
      likeCount: comments.likeCount,
    })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (!comment || comment.isDeleted) {
    return { error: "댓글을 찾을 수 없습니다." };
  }

  if (await isEitherBlocked(user.id, comment.authorId)) {
    return { error: "차단된 사용자의 댓글에는 좋아요할 수 없습니다." };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ userId: commentLikes.userId })
        .from(commentLikes)
        .where(and(eq(commentLikes.userId, user.id), eq(commentLikes.commentId, commentId)))
        .limit(1);

      if (existing) {
        await tx
          .delete(commentLikes)
          .where(and(eq(commentLikes.userId, user.id), eq(commentLikes.commentId, commentId)));
        await tx
          .update(comments)
          .set({ likeCount: sql`GREATEST(like_count - 1, 0)` })
          .where(eq(comments.id, commentId));
      } else {
        await tx.insert(commentLikes).values({ userId: user.id, commentId });
        await tx
          .update(comments)
          .set({ likeCount: sql`like_count + 1` })
          .where(eq(comments.id, commentId));
      }

      const [updated] = await tx
        .select({ likeCount: comments.likeCount })
        .from(comments)
        .where(eq(comments.id, commentId))
        .limit(1);

      return {
        liked: !existing,
        likeCount: updated?.likeCount ?? comment.likeCount,
      };
    });

    if (result.liked) {
      await createNotification({
        recipientId: comment.authorId,
        actorId: user.id,
        type: "comment_like",
        postId: comment.postId,
        commentId,
      });
    }

    return result;
  } catch {
    return { error: "좋아요 처리에 실패했습니다." };
  }
}
