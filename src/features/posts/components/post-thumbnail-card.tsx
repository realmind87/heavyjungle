import Link from "next/link";
import type { PostListItem } from "@/features/posts/queries";
import { buildPostDetailHref, type PostListUiState } from "@/features/posts/post-list-state";
import { ProfileAuthorLink } from "@/features/profile/components/ProfileAuthorLink";
import { resolveAvatarPublicUrl } from "@/lib/public-object-url";

type PostThumbnailCardProps = {
  post: PostListItem;
  returnListState?: Pick<PostListUiState, "sort" | "view">;
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

function VideoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-10 w-10"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m17 10 4-2v8l-4-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 4 3-4 3z" />
    </svg>
  );
}

/** 썸네일 그리드용 글 카드 */
export function PostThumbnailCard({ post, returnListState }: PostThumbnailCardProps) {
  const postHref = returnListState
    ? buildPostDetailHref(post.id, returnListState)
    : `/posts/${post.id}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:hover:border-zinc-700">
      <Link href={postHref} className="block">
        <div className="flex aspect-video px-3 py-3 w-full items-center justify-center">
          {post.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- 글 본문 대표 이미지
            <img
              src={post.coverImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : post.coverType === "video" || post.coverType === "youtube" ? (
            <div className="flex flex-col w-full h-full rounded-xl items-center justify-center gap-1 text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/80">
              <VideoIcon />
              <span className="text-xs">동영상</span>
            </div>
          ) : (
            <div className="flex flex-col w-full h-full rounded-xl items-center justify-center gap-1 text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/80">
              <NoImageIcon />
              <span className="text-xs">이미지 없음</span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <ProfileAuthorLink
          username={post.author.username}
          avatarUrl={resolveAvatarPublicUrl(post.author.avatarUrl)}
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
