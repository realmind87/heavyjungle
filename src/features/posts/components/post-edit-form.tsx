"use client";

import { useActionState } from "react";
import { deletePost, updatePost, type PostActionState } from "@/features/posts/actions";
import {
  buttonDangerClass,
  buttonPrimaryClass,
  errorTextClass,
  inputClass,
  labelMediumClass,
  textareaClass,
} from "@/lib/ui-classes";

type PostEditFormProps = {
  postId: string;
  initialTitle: string;
  initialContent: string;
};

/** 글 수정·삭제 폼 — 작성자/관리자 전용 */
export function PostEditForm({ postId, initialTitle, initialContent }: PostEditFormProps) {
  const [updateState, updateAction, updatePending] = useActionState(updatePost, {} as PostActionState);
  const [deleteState, deleteAction, deletePending] = useActionState(deletePost, {} as PostActionState);

  return (
    <div className="space-y-8">
      <form action={updateAction} className="space-y-4">
        <input type="hidden" name="postId" value={postId} />
        <div>
          <label htmlFor="title" className={`block ${labelMediumClass}`}>
            제목
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={200}
            defaultValue={initialTitle}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label htmlFor="content" className={`block ${labelMediumClass}`}>
            내용
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={12}
            defaultValue={initialContent}
            className={`mt-1 ${textareaClass}`}
          />
        </div>
        {updateState.error && <p className={errorTextClass}>{updateState.error}</p>}
        <button type="submit" disabled={updatePending} className={buttonPrimaryClass}>
          {updatePending ? "저장 중..." : "수정 저장"}
        </button>
      </form>

      <form action={deleteAction} className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <input type="hidden" name="postId" value={postId} />
        {deleteState.error && <p className={`mb-2 ${errorTextClass}`}>{deleteState.error}</p>}
        <button type="submit" disabled={deletePending} className={buttonDangerClass}>
          {deletePending ? "삭제 중..." : "글 삭제"}
        </button>
      </form>
    </div>
  );
}
