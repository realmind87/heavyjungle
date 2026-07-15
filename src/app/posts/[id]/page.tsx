import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { isEitherBlocked } from "@/features/blocks/queries";
import { parseCommentSort } from "@/features/comments/comment-sort";
import { CommentSection } from "@/features/comments/components/comment-section";
import { getUserLikeForPost } from "@/features/likes/queries";
import { PostDetail } from "@/features/posts/components/post-detail";
import { getPostById } from "@/features/posts/queries";
import { buildBackHrefFromListParam } from "@/features/posts/post-list-state";
import { buildPageMetadata, firstImageFromHtml, plainTextFromHtml } from "@/lib/metadata";
import { resolveStoragePublicUrl } from "@/lib/storage-url";
import { linkMutedClass } from "@/lib/ui-classes";
import { canModifyPost } from "@/server/auth/permissions";
import { getCurrentUser } from "@/server/auth/current-user";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ list?: string; commentSort?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post || post.isDeleted) {
    return buildPageMetadata({
      title: "글을 찾을 수 없음",
      path: `/posts/${id}`,
      noIndex: true,
    });
  }

  const ogImage = firstImageFromHtml(post.content);
  return buildPageMetadata({
    title: post.title,
    description: plainTextFromHtml(post.content),
    path: `/posts/${id}`,
    imageUrl: ogImage ? (resolveStoragePublicUrl(ogImage) ?? ogImage) : undefined,
  });
}

export default async function PostDetailPage({ params, searchParams }: PageProps) {
  const { id: postId } = await params;
  const { list, commentSort } = await searchParams;
  const commentSortValue = parseCommentSort(commentSort);
  const user = await getCurrentUser();

  const post = await getPostById(postId);

  if (!post || post.isDeleted) notFound();

  if (user && (await isEitherBlocked(user.id, post.author.id))) {
    notFound();
  }

  const backHref =
    list != null
      ? buildBackHrefFromListParam(list)
      : post.category === "notice"
        ? "/notices"
        : "/";
  const backLabel = post.category === "notice" && list == null ? "← 공지사항" : "← 목록으로";

  const liked = user ? await getUserLikeForPost(user.id, postId) : false;
  const canEdit = canModifyPost(user, post.author.id);
  const canReport = !!user && user.id !== post.author.id;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-8 pb-20 md:pb-8">
        <Link href={backHref} className={linkMutedClass}>
          {backLabel}
        </Link>

        <PostDetail
          post={post}
          liked={liked}
          isLoggedIn={!!user}
          canEdit={canEdit}
          canReport={canReport}
        />

        <CommentSection
          postId={postId}
          user={user}
          sort={commentSortValue}
          listParam={list}
          commentCount={post.commentCount}
        />
      </main>
    </div>
  );
}
