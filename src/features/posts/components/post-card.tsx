import Link from "next/link";
import { formatRelativeTime } from "@/lib/time";
import type { PostListItem } from "@/features/posts/queries";

type PostCardProps = {
  post: PostListItem;
};

/** 글 목록 카드 — 제목, 메타 */
export function PostCard({ post }: PostCardProps) {
  return (
    <article className="border-b border-zinc-200 py-4 dark:border-zinc-800">
      <div className="min-w-0 pl-2 pr-2">
        <span className="text-xs">{post.author.username}</span>
        
        <div className="flex justify-between gap-1">
          <Link
            href={`/posts/${post.id}`}
            className="block font-medium text-zinc-900 hover:underline dark:text-zinc-50"
          >
            {post.title}
          </Link>
          <span className="font-medium">{post.commentCount}</span>
        </div>

        <p className="mt-2 text-xs text-zinc-500">
          <time dateTime={post.createdAt.toISOString()}>{formatRelativeTime(post.createdAt)}</time>
          <span className="mx-1">·</span>
          <span>조회 {post.viewCount}</span>
          <span className="mx-1">·</span>
          <span>좋아요 {post.likeCount}</span>
        </p>
      </div>
    </article>
  );
}
