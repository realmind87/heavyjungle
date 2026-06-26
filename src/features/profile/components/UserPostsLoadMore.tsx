import Link from "next/link";

type UserPostsLoadMoreProps = {
  username: string;
  nextCursor: string | null;
};

/** 프로필 작성 글 cursor 페이지네이션 */
export function UserPostsLoadMore({ username, nextCursor }: UserPostsLoadMoreProps) {
  if (!nextCursor) return null;

  const href = `/u/${username}?cursor=${encodeURIComponent(nextCursor)}`;

  return (
    <div className="py-6 text-center">
      <Link href={href} className="inline-block border px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900">
        더 보기
      </Link>
    </div>
  );
}
