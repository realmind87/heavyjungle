import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { CommentSection } from "@/features/comments/components/comment-section";
import { LikeButton } from "@/features/likes/components/like-button";
import { getUserLikeForPost } from "@/features/likes/queries";
import { incrementViewCount } from "@/features/posts/actions";
import { getPostById } from "@/features/posts/queries";
import { formatRelativeTime } from "@/lib/time";
import { canModifyPost } from "@/server/auth/permissions";
import { getCurrentUser } from "@/server/auth/current-user";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostDetailPage({ params }: PageProps) {
  const { id: postId } = await params;
  const user = await getCurrentUser();
  const post = await getPostById(postId);

  if (!post || post.isDeleted) notFound();

  await incrementViewCount(postId);

  const liked = user ? await getUserLikeForPost(user.id, postId) : false;
  const canEdit = canModifyPost(user, post.author.id);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← 목록으로
        </Link>

        <article className="mt-6">
          <h1 className="text-2xl font-bold">{post.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <span>{post.author.username}</span>
            <span>·</span>
            <time dateTime={post.createdAt.toISOString()}>{formatRelativeTime(post.createdAt)}</time>
            <span>·</span>
            <span>조회 {post.viewCount + 1}</span>
            <span>·</span>
            <span>댓글 {post.commentCount}</span>
          </div>
          <div className="mt-4">
            <LikeButton
              postId={postId}
              initialLiked={liked}
              initialLikeCount={post.likeCount}
              isLoggedIn={!!user}
            />
          </div>
          <div className="mt-8 whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">{post.content}</div>
        </article>

        {canEdit && (
          <div className="mt-6">
            <Link href={`/posts/${postId}/edit`} className="text-sm text-blue-600 hover:underline">
              수정
            </Link>
          </div>
        )}

        <CommentSection postId={postId} commentCount={post.commentCount} user={user} />
      </main>
    </div>
  );
}
