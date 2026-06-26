"use client";

import { useActionState } from "react";
import { createComment, type CommentActionState } from "@/features/comments/actions";
import { buttonPrimaryClass, errorTextClass } from "@/lib/ui-classes";

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
      <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
        <textarea
          name="content"
          required
          rows={3}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent text-sm text-zinc-900 outline-none dark:text-zinc-50"
        />
        {state.error && <p className={errorTextClass}>{state.error}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className={buttonPrimaryClass}>
            {pending ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>
    </form>
  );
}
