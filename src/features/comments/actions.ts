"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isEitherBlocked } from "@/features/blocks/queries";
import { createCommentSchema, deleteCommentSchema } from "@/features/comments/validators";
import { getPostById } from "@/features/posts/queries";
import { isCommentHtmlEmpty } from "@/lib/sanitize-comment-html";
import { sanitizeCommentHtml } from "@/lib/sanitize-comment-html.server";
import { canModifyComment, requireUser } from "@/server/auth/permissions";
import { db } from "@/server/db";
import { comments, posts } from "@/server/db/schema";

export type CommentActionState = {
  error?: string;
  success?: boolean;
};

export async function createComment(
  _prevState: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const parsed = createCommentSchema.safeParse({
    postId: formData.get("postId"),
    parentId: formData.get("parentId") ?? undefined,
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { postId, parentId } = parsed.data;
  const content = sanitizeCommentHtml(parsed.data.content);

  if (isCommentHtmlEmpty(content)) {
    return { error: "댓글을 입력하세요." };
  }

  const post = await getPostById(postId);
  if (!post || post.isDeleted) {
    return { error: "글을 찾을 수 없습니다." };
  }

  if (await isEitherBlocked(user.id, post.author.id)) {
    return { error: "차단된 사용자와는 댓글을 주고받을 수 없습니다." };
  }

  try {
    await db.transaction(async (tx) => {
      const [existingPost] = await tx
        .select({ id: posts.id })
        .from(posts)
        .where(and(eq(posts.id, postId), eq(posts.isDeleted, false)))
        .limit(1);

      if (!existingPost) {
        throw new Error("POST_NOT_FOUND");
      }

      if (parentId) {
        const [parent] = await tx
          .select({ id: comments.id, parentId: comments.parentId })
          .from(comments)
          .where(and(eq(comments.id, parentId), eq(comments.postId, postId)))
          .limit(1);

        if (!parent) {
          throw new Error("PARENT_NOT_FOUND");
        }
      }

      await tx.insert(comments).values({
        postId,
        parentId: parentId ?? null,
        authorId: user.id,
        content,
      });

      await tx
        .update(posts)
        .set({ commentCount: sql`comment_count + 1` })
        .where(eq(posts.id, postId));
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PARENT_NOT_FOUND") {
        return { error: "상위 댓글을 찾을 수 없습니다." };
      }
      if (error.message === "POST_NOT_FOUND") {
        return { error: "글을 찾을 수 없습니다." };
      }
    }
    throw error;
  }

  revalidatePath(`/posts/${postId}`);
  return { success: true };
}

export async function deleteComment(
  _prevState: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const parsed = deleteCommentSchema.safeParse({
    commentId: formData.get("commentId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { commentId } = parsed.data;

  const [comment] = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      authorId: comments.authorId,
      isDeleted: comments.isDeleted,
    })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (!comment) {
    return { error: "댓글을 찾을 수 없습니다." };
  }

  if (comment.isDeleted) {
    return { error: "이미 삭제된 댓글입니다." };
  }

  if (!canModifyComment(user, comment.authorId)) {
    return { error: "삭제 권한이 없습니다." };
  }

  const post = await getPostById(comment.postId);
  if (!post) {
    return { error: "글을 찾을 수 없습니다." };
  }

  await db.transaction(async (tx) => {
    await tx.update(comments).set({ isDeleted: true }).where(eq(comments.id, commentId));

    await tx
      .update(posts)
      .set({ commentCount: sql`GREATEST(comment_count - 1, 0)` })
      .where(eq(posts.id, comment.postId));
  });

  revalidatePath(`/posts/${comment.postId}`);
  return {};
}
