"use client";

import { useActionState } from "react";
import { createComment, type CommentActionState } from "@/features/comments/actions";

type CommentFormProps = {
  postId: string;
  placeholder?: string;
};

/** 최상위 댓글 작성 폼 */
export function CommentForm({ postId, placeholder = "댓글을 입력하세요" }: CommentFormProps) {
  const [state, formAction, pending] = useActionState(createComment, {} as CommentActionState);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="postId" value={postId} />
      <textarea
        name="content"
        required
        rows={3}
        placeholder={placeholder}
        className="w-full border px-3 py-2 text-sm"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="border px-3 py-1 text-sm disabled:opacity-50">
        {pending ? "등록 중..." : "댓글 달기"}
      </button>
    </form>
  );
}
