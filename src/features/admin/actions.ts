"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  adminDeleteCommentSchema,
  adminDeletePostSchema,
  setUserRoleSchema,
} from "@/features/admin/validators";
import { getPostById } from "@/features/posts/queries";
import { requireAdminUser } from "@/server/auth/permissions";
import { db } from "@/server/db";
import { comments, posts, users } from "@/server/db/schema";

export type AdminActionState = {
  error?: string;
};

export async function adminDeletePost(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const user = await requireAdminUser();
  if (!user) {
    return { error: "관리자 권한이 필요합니다." };
  }

  const parsed = adminDeletePostSchema.safeParse({
    postId: formData.get("postId"),
  });

  if (!parsed.success) {
    return { error: "유효하지 않은 요청입니다." };
  }

  const post = await getPostById(parsed.data.postId);
  if (!post || post.isDeleted) {
    return { error: "글을 찾을 수 없습니다." };
  }

  await db.update(posts).set({ isDeleted: true }).where(eq(posts.id, parsed.data.postId));

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/posts/${parsed.data.postId}`);
  return {};
}

export async function adminDeleteComment(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const user = await requireAdminUser();
  if (!user) {
    return { error: "관리자 권한이 필요합니다." };
  }

  const parsed = adminDeleteCommentSchema.safeParse({
    commentId: formData.get("commentId"),
  });

  if (!parsed.success) {
    return { error: "유효하지 않은 요청입니다." };
  }

  const [comment] = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      isDeleted: comments.isDeleted,
    })
    .from(comments)
    .where(eq(comments.id, parsed.data.commentId))
    .limit(1);

  if (!comment) {
    return { error: "댓글을 찾을 수 없습니다." };
  }

  if (comment.isDeleted) {
    return { error: "이미 삭제된 댓글입니다." };
  }

  await db.transaction(async (tx) => {
    await tx.update(comments).set({ isDeleted: true }).where(eq(comments.id, comment.id));

    await tx
      .update(posts)
      .set({ commentCount: sql`GREATEST(comment_count - 1, 0)` })
      .where(eq(posts.id, comment.postId));
  });

  revalidatePath("/admin");
  revalidatePath(`/posts/${comment.postId}`);
  return {};
}

export async function setUserRole(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const user = await requireAdminUser();
  if (!user) {
    return { error: "관리자 권한이 필요합니다." };
  }

  const parsed = setUserRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: "유효하지 않은 요청입니다." };
  }

  const { userId, role } = parsed.data;

  if (userId === user.id && role === "user") {
    return { error: "자신의 관리자 권한은 해제할 수 없습니다." };
  }

  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!target) {
    return { error: "사용자를 찾을 수 없습니다." };
  }

  await db.update(users).set({ role }).where(eq(users.id, userId));

  revalidatePath("/admin");
  return {};
}
