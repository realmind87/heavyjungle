"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { toast } from "@/components/ui/toast";
import type { ToggleCommentLikeResult } from "@/features/comments/like-actions";

type LikeState = {
  liked: boolean;
  likeCount: number;
};

type CommentLikeButtonProps = {
  commentId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  isLoggedIn: boolean;
};

function HeartIcon({ filled = false }: { filled?: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      />
    </svg>
  );
}

async function requestToggleCommentLike(commentId: string): Promise<ToggleCommentLikeResult> {
  const response = await fetch(`/api/comments/${commentId}/like`, { method: "POST" });
  return response.json() as Promise<ToggleCommentLikeResult>;
}

/** 댓글 좋아요 토글 — 글 좋아요와 동일한 낙관적 업데이트 패턴 */
export function CommentLikeButton({
  commentId,
  initialLiked,
  initialLikeCount,
  isLoggedIn,
}: CommentLikeButtonProps) {
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
  }, [commentId, initialLiked, initialLikeCount]);

  if (!isLoggedIn) {
    if (initialLikeCount === 0) return null;
    return (
      <span className="inline-flex shrink-0 items-center gap-1 p-1 text-xs text-zinc-500 dark:text-zinc-400">
        <HeartIcon />
        {initialLikeCount}
      </span>
    );
  }

  function handleToggle() {
    const nextLiked = !optimistic.liked;

    startTransition(async () => {
      setOptimistic(nextLiked);
      const result = await requestToggleCommentLike(commentId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.liked !== undefined && result.likeCount !== undefined) {
        setLikeState({ liked: result.liked, likeCount: result.likeCount });
      }
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleToggle}
      aria-label={optimistic.liked ? "좋아요 취소" : "좋아요"}
      className={`inline-flex shrink-0 items-center gap-1 p-1 text-xs transition disabled:opacity-50 ${
        optimistic.liked
          ? "text-red-600 dark:text-red-400"
          : "text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
      }`}
    >
      <HeartIcon filled={optimistic.liked} />
      {optimistic.likeCount > 0 && optimistic.likeCount}
    </button>
  );
}
