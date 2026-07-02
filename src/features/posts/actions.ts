"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPostById } from "@/features/posts/queries";
import { createPostFormSchema, updatePostSchema } from "@/features/posts/validators";
import { isPostHtmlEmpty } from "@/lib/sanitize-post-html";
import { sanitizePostHtml } from "@/lib/sanitize-post-html.server";
import { canModifyPost, requireUser } from "@/server/auth/permissions";
import { db } from "@/server/db";
import { posts } from "@/server/db/schema";

export type PostActionState = {
  error?: string;
};

export async function createPost(
  _prevState: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const parsed = createPostFormSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { title, content: rawContent } = parsed.data;
  const content = sanitizePostHtml(rawContent);

  if (isPostHtmlEmpty(content)) {
    return { error: "내용을 입력하세요." };
  }

  const [post] = await db
    .insert(posts)
    .values({ authorId: user.id, title, content })
    .returning({ id: posts.id });

  revalidatePath("/");
  redirect(`/posts/${post.id}`);
}

export async function updatePost(
  _prevState: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const parsed = updatePostSchema.safeParse({
    postId: formData.get("postId"),
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { postId, title, content: rawContent } = parsed.data;
  const content = sanitizePostHtml(rawContent);

  if (isPostHtmlEmpty(content)) {
    return { error: "내용을 입력하세요." };
  }

  const post = await getPostById(postId);

  if (!post || post.isDeleted) {
    return { error: "글을 찾을 수 없습니다." };
  }

  if (!canModifyPost(user, post.author.id)) {
    return { error: "수정 권한이 없습니다." };
  }

  await db
    .update(posts)
    .set({ title, content })
    .where(eq(posts.id, postId));

  revalidatePath(`/posts/${postId}`);
  revalidatePath("/");
  redirect(`/posts/${postId}`);
}

export async function deletePost(
  _prevState: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const postId = formData.get("postId");
  if (typeof postId !== "string") {
    return { error: "유효하지 않은 요청입니다." };
  }

  const post = await getPostById(postId);
  if (!post || post.isDeleted) {
    return { error: "글을 찾을 수 없습니다." };
  }

  if (!canModifyPost(user, post.author.id)) {
    return { error: "삭제 권한이 없습니다." };
  }

  await db.update(posts).set({ isDeleted: true }).where(eq(posts.id, postId));

  revalidatePath("/");
  redirect("/");
}
