import Link from "next/link";
import { PostDeleteButton } from "@/features/posts/components/post-delete-button";
import { EditIcon } from "@/features/posts/components/post-detail-icons";
import { ProfileAuthorLink } from "@/features/profile/components/ProfileAuthorLink";
import { resolveStoragePublicUrl } from "@/lib/storage-url";
import { formatRelativeTime } from "@/lib/time";

type PostDetailHeaderProps = {
  postId: string;
  createdAt: Date;
  author: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  canEdit: boolean;
};

/** 글 상세 상단 — 작성자·작성일·수정/삭제 */
export function PostDetailHeader({ postId, createdAt, author, canEdit }: PostDetailHeaderProps) {
  return (
    <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
      <ProfileAuthorLink
        username={author.username}
        displayName={author.displayName}
        avatarUrl={resolveStoragePublicUrl(author.avatarUrl)}
      />
      <span>·</span>
      <time dateTime={createdAt.toISOString()}>{formatRelativeTime(createdAt)}</time>

      {canEdit && (
        <div className="ml-auto flex items-center gap-3">
          <Link href={`/posts/${postId}/edit`} aria-label="수정">
            <EditIcon />
          </Link>
          <PostDeleteButton postId={postId} />
        </div>
      )}
    </div>
  );
}
