import Link from "next/link";
import type { PostListItem } from "@/features/posts/queries";
import { buildPostDetailHref, type PostListUiState } from "@/features/posts/post-list-state";
import { ProfileAuthorLink } from "@/features/profile/components/ProfileAuthorLink";
import { PostCoverPreview } from "@/features/posts/components/post-cover-preview";

type PostThumbnailCardProps = {
  post: PostListItem;
  returnListState?: Pick<PostListUiState, "sort" | "view" | "feed">;
};

function NoImageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-10 w-10"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 17 5.5-5.5a1 1 0 0 1 1.4 0L14 16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 14 2.5-2.5a1 1 0 0 1 1.4 0L21 17" />
      <path strokeLinecap="round" d="M3 3l18 18" />
    </svg>
  );
}

/** 썸네일 그리드용 글 카드 */
export function PostThumbnailCard({ post, returnListState }: PostThumbnailCardProps) {
  const postHref = returnListState
    ? buildPostDetailHref(post.id, returnListState)
    : `/posts/${post.id}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <Link href={postHref} className="block">
        <div className="flex aspect-video w-full items-center justify-center px-3 py-3">
          {post.coverType ? (
            <PostCoverPreview
              coverImageUrl={post.coverImageUrl}
              coverType={post.coverType}
              className="h-full w-full rounded-xl"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800/80 dark:text-zinc-500">
              <NoImageIcon />
              <span className="text-xs">이미지 없음</span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <ProfileAuthorLink
          username={post.author.username}
          displayName={post.author.displayName}
          avatarUrl={post.author.avatarUrl}
        />

        <Link
          href={postHref}
          className="mt-3 line-clamp-2 flex-1 font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          {post.title}
        </Link>

        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>좋아요 {post.likeCount}</span>
          <span className="mx-1">·</span>
          <span>댓글 {post.commentCount}</span>
          <span className="mx-1">·</span>
          <span>조회 {post.viewCount}</span>
        </p>
      </div>
    </article>
  );
}
