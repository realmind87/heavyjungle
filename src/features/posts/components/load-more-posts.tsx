import Link from "next/link";
import { buildPostListHref, type PostListUiState } from "@/features/posts/post-list-state";
import { outlineChipClass } from "@/lib/ui-classes";

type LoadMorePostsProps = {
  nextCursor: string | null;
  listState: PostListUiState;
};

/** cursor 쿼리로 다음 페이지 로드 (링크 기반 "더 보기") */
export function LoadMorePosts({ nextCursor, listState }: LoadMorePostsProps) {
  if (!nextCursor) return null;

  const href = buildPostListHref({ ...listState, cursor: nextCursor });

  return (
    <div className="py-6 text-center">
      <Link href={href} className={outlineChipClass}>
        더 보기
      </Link>
    </div>
  );
}
