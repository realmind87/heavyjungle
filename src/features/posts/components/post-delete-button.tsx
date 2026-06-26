"use client";

import { useActionState, useEffect } from "react";
import { postMetaIconOnlyChipClass } from "@/components/posts/post-meta-chip";
import { toast } from "@/components/ui/toast";
import { deletePost, type PostActionState } from "@/features/posts/actions";

type PostDeleteButtonProps = {
  postId: string;
};

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6" />
    </svg>
  );
}

/** 글 삭제 — 작성자/관리자 전용, 상세 페이지 메타 액션 */
export function PostDeleteButton({ postId }: PostDeleteButtonProps) {
  const [state, formAction, pending] = useActionState(deletePost, {} as PostActionState);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!confirm("이 글을 삭제할까요?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="postId" value={postId} />
      <button
        type="submit"
        disabled={pending}
        aria-label="삭제"
      >
        <TrashIcon />
      </button>
    </form>
  );
}
