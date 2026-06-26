import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { PostMetaChip, postMetaIconOnlyChipClass } from "@/components/posts/post-meta-chip";
import { CommentSection } from "@/features/comments/components/comment-section";
import { LikeButton } from "@/features/likes/components/like-button";
import { getUserLikeForPost } from "@/features/likes/queries";
import { PostContent } from "@/features/posts/components/post-content";
import { PostDeleteButton } from "@/features/posts/components/post-delete-button";
import { PostViewCount } from "@/features/posts/components/post-view-count";
import { getPostById } from "@/features/posts/queries";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { resolveAvatarPublicUrl } from "@/lib/storage-url";
import { formatRelativeTime } from "@/lib/time";
import { canModifyPost } from "@/server/auth/permissions";
import { getCurrentUser } from "@/server/auth/current-user";
import { linkMutedClass, pageTitleClass } from "@/lib/ui-classes";

type PageProps = {
  params: Promise<{ id: string }>;
};

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

export default async function PostDetailPage({ params }: PageProps) {
  const { id: postId } = await params;
  const user = await getCurrentUser();

  const post = await getPostById(postId);

  if (!post || post.isDeleted) notFound();

  const liked = user ? await getUserLikeForPost(user.id, postId) : false;
  const canEdit = canModifyPost(user, post.author.id);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/" className={linkMutedClass}>
          ← 목록으로
        </Link>

        <article className="mt-6">
          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <ProfileAvatar
              name={post.author.displayName ?? post.author.username}
              avatarUrl={resolveAvatarPublicUrl(post.author.avatarUrl)}
              size="xs"
            />
            <span>{post.author.username}</span>

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

          <h1 className={`mt-1 ${pageTitleClass}`}>{post.title}</h1>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            <time dateTime={post.createdAt.toISOString()}>{formatRelativeTime(post.createdAt)}</time>
          </div>
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
        </div>

        <CommentSection postId={postId} commentCount={post.commentCount} user={user} />
      </main>
    </div>
  );
}
