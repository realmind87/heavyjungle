"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { PostMetaChip, postMetaChipClass } from "@/components/posts/post-meta-chip";
import { toast } from "@/components/ui/toast";
import type { ToggleLikeResult } from "@/features/likes/actions";

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

function HeartIcon({ filled = false }: { filled?: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      />
    </svg>
  );
}

async function requestToggleLike(postId: string): Promise<ToggleLikeResult> {
  const response = await fetch(`/api/posts/${postId}/like`, { method: "POST" });

  return response.json() as Promise<ToggleLikeResult>;
}

/** 글 좋아요 토글 — useOptimistic으로 즉시 반영, 실패 시 트랜지션 종료 후 롤백 */
export function LikeButton({ postId, initialLiked, initialLikeCount, isLoggedIn }: LikeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [likeState, setLikeState] = useState<LikeState>({
    liked: initialLiked,
    likeCount: initialLikeCount,
  });
  const [optimistic, setOptimistic] = useOptimistic(likeState, (state: LikeState, nextLiked: boolean): LikeState => ({
    liked: nextLiked,
    likeCount: state.likeCount + (nextLiked ? 1 : -1),
  }));

  useEffect(() => {
    setLikeState({ liked: initialLiked, likeCount: initialLikeCount });
  }, [postId, initialLiked, initialLikeCount]);

  function handleToggle() {
    if (!isLoggedIn) return;
    const nextLiked = !optimistic.liked;

    startTransition(async () => {
      setOptimistic(nextLiked);
      const result = await requestToggleLike(postId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.liked !== undefined && result.likeCount !== undefined) {
        setLikeState({ liked: result.liked, likeCount: result.likeCount });
      }
    });
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <PostMetaChip aria-label={`좋아요 ${initialLikeCount}`}>
          <HeartIcon />
          {initialLikeCount}
        </PostMetaChip>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleToggle}
      className={`${postMetaChipClass} disabled:opacity-50 ${optimistic.liked ? "border-red-200 text-red-600 dark:border-red-900" : "hover:text-red-600"
        }`}
      aria-label={optimistic.liked ? "좋아요 취소" : "좋아요"}
    >
      <HeartIcon filled={optimistic.liked} />
      {optimistic.likeCount}
    </button>
  );
}
