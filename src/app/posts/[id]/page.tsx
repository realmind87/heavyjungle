import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { PostMetaChip, postMetaChipClass } from "@/components/posts/post-meta-chip";
import { isEitherBlocked } from "@/features/blocks/queries";
import { CommentSection } from "@/features/comments/components/comment-section";
import { LikeButton } from "@/features/likes/components/like-button";
import { getUserLikeForPost } from "@/features/likes/queries";
import { PostContent } from "@/features/posts/components/post-content";
import { PostDeleteButton } from "@/features/posts/components/post-delete-button";
import { PostViewCount } from "@/features/posts/components/post-view-count";
import { getPostById } from "@/features/posts/queries";
import { ProfileAuthorLink } from "@/features/profile/components/ProfileAuthorLink";
import { ReportButton } from "@/features/reports/components/report-button";
import { buildPageMetadata, firstImageFromHtml, plainTextFromHtml } from "@/lib/metadata";
import { resolveStoragePublicUrl } from "@/lib/storage-url";
import { formatRelativeTime } from "@/lib/time";
import { canModifyPost } from "@/server/auth/permissions";
import { getCurrentUser } from "@/server/auth/current-user";
import { buildBackHrefFromListParam } from "@/features/posts/post-list-state";
import { linkMutedClass, pageTitleClass } from "@/lib/ui-classes";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ list?: string }>;
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

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export default async function PostDetailPage({ params, searchParams }: PageProps) {
  const { id: postId } = await params;
  const { list } = await searchParams;
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
      <main className="mx-auto max-w-4xl px-4 py-8 pb-20 md:pb-8">
        <Link href={backHref} className={linkMutedClass}>
          {backLabel}
        </Link>

        <article className="mt-6">
          <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <ProfileAuthorLink
              username={post.author.username}
              displayName={post.author.displayName}
              avatarUrl={resolveStoragePublicUrl(post.author.avatarUrl)}
            />
            <span>·</span>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              <time dateTime={post.createdAt.toISOString()}>{formatRelativeTime(post.createdAt)}</time>
            </div>

            {canEdit && (
              <div className="flex items-center  gap-3 ml-auto">
                <Link
                  href={`/posts/${postId}/edit`}
                  aria-label="수정"
                >
                  <EditIcon />
                </Link>
                <PostDeleteButton postId={postId} />
              </div>
            )}

          </div>

          <h1 className={`mt-3 ${pageTitleClass}`}>{post.title}</h1>

          <PostContent content={post.content} />
        </article>


        <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <LikeButton
            postId={postId}
            initialLiked={liked}
            initialLikeCount={post.likeCount}
            isLoggedIn={!!user}
          />
          <PostViewCount postId={postId} initialViewCount={post.viewCount} />
          <PostMetaChip aria-label={`댓글 ${post.commentCount}`}>
            <CommentIcon />
            {post.commentCount}
          </PostMetaChip>
          {canReport && (
            <ReportButton
              targetType="post"
              targetId={postId}
              label="신고"
              className={`${postMetaChipClass} ml-auto transition hover:border-red-300 hover:text-red-600 dark:hover:border-red-800 dark:hover:text-red-400`}
            />
          )}
        </div>

        <CommentSection postId={postId} user={user} />
      </main>
    </div>
  );
}
