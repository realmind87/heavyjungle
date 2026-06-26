"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toggleLike } from "@/features/likes/actions";

type LikeState = {
  liked: boolean;
  likeCount: number;
};

type LikeButtonProps = {
  postId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  isLoggedIn: boolean;
};

/** 글 좋아요 토글 — useOptimistic으로 즉시 반영, 실패 시 트랜지션 종료 후 롤백 */
export function LikeButton({ postId, initialLiked, initialLikeCount, isLoggedIn }: LikeButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { liked: initialLiked, likeCount: initialLikeCount },
    (state: LikeState, nextLiked: boolean): LikeState => ({
      liked: nextLiked,
      likeCount: state.likeCount + (nextLiked ? 1 : -1),
    }),
  );

  function handleToggle() {
    if (!isLoggedIn) return;
    setError(null);
    const nextLiked = !optimistic.liked;

    startTransition(async () => {
      setOptimistic(nextLiked);
      const result = await toggleLike(postId);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <span>♥ {initialLikeCount}</span>
        <span className="text-xs">로그인 후 좋아요</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={handleToggle}
        className={`rounded border px-3 py-1 text-sm disabled:opacity-50 ${
          optimistic.liked ? "border-red-300 bg-red-50 text-red-600" : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
        }`}
        aria-label={optimistic.liked ? "좋아요 취소" : "좋아요"}
      >
        {optimistic.liked ? "♥" : "♡"} {optimistic.likeCount}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
