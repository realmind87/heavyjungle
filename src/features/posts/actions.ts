"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminAction } from "@/features/admin/audit-log";
import { getPostById } from "@/features/posts/queries";
import {
  createPostFormSchema,
  postCategorySchema,
  updatePostSchema,
  type PostCategory,
} from "@/features/posts/validators";
import { isPostHtmlEmpty } from "@/lib/sanitize-post-html";
import { sanitizePostHtml } from "@/lib/sanitize-post-html.server";
import { canModifyPost, isAdmin, requireUser } from "@/server/auth/permissions";
import { db } from "@/server/db";
import { posts } from "@/server/db/schema";
import { assertContentLinksSafe } from "@/server/safety/link-check";
import {
  afterContentSavedWithExternalLinks,
  guardNewAccountExternalLinks,
} from "@/server/safety/new-account-links";

export type PostActionState = {
  error?: string;
};

function revalidatePostListPaths(category: PostCategory, postId?: string) {
  revalidatePath("/");
  if (postId) {
    revalidatePath(`/posts/${postId}`);
  }
  if (category === "notice") {
    revalidatePath("/notices");
  }
}

function resolvePostCategory(raw: FormDataEntryValue | null, userIsAdmin: boolean): PostCategory {
  if (!userIsAdmin) return "general";
  const parsed = postCategorySchema.safeParse(raw ?? "general");
  return parsed.success ? parsed.data : "general";
}

export async function createPost(
  _prevState: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const userIsAdmin = isAdmin(user);
  const category = resolvePostCategory(formData.get("category"), userIsAdmin);

  const parsed = createPostFormSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    category,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { title, content: rawContent } = parsed.data;
  const content = sanitizePostHtml(rawContent);

  if (isPostHtmlEmpty(content)) {
    return { error: "내용을 입력하세요." };
  }

  const linkError = await assertContentLinksSafe(content);
  if (linkError) {
    return { error: linkError };
  }

  const newAccountLimitError = await guardNewAccountExternalLinks(user, "post", content);
  if (newAccountLimitError) {
    return { error: newAccountLimitError };
  }

  if (category === "notice" && !userIsAdmin) {
    return { error: "공지사항은 관리자만 등록할 수 있습니다." };
  }

  const [post] = await db
    .insert(posts)
    .values({ authorId: user.id, title, content, category })
    .returning({ id: posts.id });

  if (category === "notice") {
    await logAdminAction({
      actorId: user.id,
      action: "notice_create",
      targetId: post.id,
      targetLabel: title,
    });
  }

  await afterContentSavedWithExternalLinks({
    user,
    target: "post",
    html: content,
    postId: post.id,
  });
  revalidatePath("/admin");

  revalidatePostListPaths(category, post.id);
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

  const userIsAdmin = isAdmin(user);
  const category = resolvePostCategory(formData.get("category"), userIsAdmin);

  const parsed = updatePostSchema.safeParse({
    postId: formData.get("postId"),
    title: formData.get("title"),
    content: formData.get("content"),
    category,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { postId, title, content: rawContent } = parsed.data;
  const content = sanitizePostHtml(rawContent);

  if (isPostHtmlEmpty(content)) {
    return { error: "내용을 입력하세요." };
  }

  const linkError = await assertContentLinksSafe(content);
  if (linkError) {
    return { error: linkError };
  }

  const newAccountLimitError = await guardNewAccountExternalLinks(user, "post", content);
  if (newAccountLimitError) {
    return { error: newAccountLimitError };
  }

  const post = await getPostById(postId);

  if (!post || post.isDeleted) {
    return { error: "글을 찾을 수 없습니다." };
  }

  if (!canModifyPost(user, post.author.id)) {
    return { error: "수정 권한이 없습니다." };
  }

  if (category === "notice" && !userIsAdmin) {
    return { error: "공지사항은 관리자만 설정할 수 있습니다." };
  }

  // 비관리자가 수정하면 기존 분류 유지 (공지를 일반으로 강등하지 않음)
  const nextCategory = userIsAdmin ? category : post.category;

  await db
    .update(posts)
    .set({ title, content, category: nextCategory })
    .where(eq(posts.id, postId));

  await afterContentSavedWithExternalLinks({
    user,
    target: "post",
    html: content,
    postId,
  });
  revalidatePath("/admin");

  if (userIsAdmin && (nextCategory === "notice" || post.category === "notice")) {
    await logAdminAction({
      actorId: user.id,
      action: "notice_update",
      targetId: postId,
      targetLabel: title,
      metadata:
        post.category !== nextCategory
          ? { categoryFrom: post.category, categoryTo: nextCategory }
          : undefined,
    });
  }

  revalidatePostListPaths(nextCategory, postId);
  if (post.category === "notice" && nextCategory !== "notice") {
    revalidatePath("/notices");
  }
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
