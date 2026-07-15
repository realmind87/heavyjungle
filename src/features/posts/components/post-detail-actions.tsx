import { PostMetaChip, postMetaChipClass } from "@/components/posts/post-meta-chip";
import { CommentCountIcon } from "@/features/posts/components/post-detail-icons";
import { PostViewCount } from "@/features/posts/components/post-view-count";
import { LikeButton } from "@/features/likes/components/like-button";
import { ReportButton } from "@/features/reports/components/report-button";

type PostDetailActionsProps = {
  postId: string;
  likeCount: number;
  viewCount: number;
  commentCount: number;
  liked: boolean;
  isLoggedIn: boolean;
  canReport: boolean;
};

/** 글 상세 하단 액션 — 좋아요·조회·댓글·신고 */
export function PostDetailActions({
  postId,
  likeCount,
  viewCount,
  commentCount,
  liked,
  isLoggedIn,
  canReport,
}: PostDetailActionsProps) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
      <LikeButton
        postId={postId}
        initialLiked={liked}
        initialLikeCount={likeCount}
        isLoggedIn={isLoggedIn}
      />
      <PostViewCount postId={postId} initialViewCount={viewCount} />
      <PostMetaChip aria-label={`댓글 ${commentCount}`}>
        <CommentCountIcon />
        {commentCount}
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
  );
}
