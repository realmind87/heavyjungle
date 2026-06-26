import Link from "next/link";

type LoadMorePostsProps = {
  nextCursor: string | null;
};

/** cursor 쿼리로 다음 페이지 로드 (링크 기반 "더 보기") */
export function LoadMorePosts({ nextCursor }: LoadMorePostsProps) {
  if (!nextCursor) return null;

  const href = `/?cursor=${encodeURIComponent(nextCursor)}`;

  return (
    <div className="py-6 text-center">
      <Link href={href} className="inline-block border px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900">
        더 보기
      </Link>
    </div>
  );
}
