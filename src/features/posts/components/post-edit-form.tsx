"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { deletePost, updatePost, type PostActionState } from "@/features/posts/actions";
import { PostRichTextEditor } from "@/features/posts/components/post-rich-text-editor";
import { isPostHtmlEmpty } from "@/lib/sanitize-post-html";
import {
  buttonDangerClass,
  buttonPrimaryClass,
  errorTextClass,
  inputClass,
  labelMediumClass,
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
  const editorRef = useRef<HTMLDivElement>(null);
  const contentInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);
  const [isContentEmpty, setIsContentEmpty] = useState(isPostHtmlEmpty(initialContent));

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || initializedRef.current) return;
    editor.innerHTML = initialContent;
    initializedRef.current = true;
    syncContent();
  }, [initialContent]);

  function syncContent() {
    const editor = editorRef.current;
    const input = contentInputRef.current;
    if (!editor || !input) return;
    const html = editor.innerHTML;
    input.value = html;
    setIsContentEmpty(isPostHtmlEmpty(html));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    syncContent();
    const html = contentInputRef.current?.value ?? "";
    if (isPostHtmlEmpty(html)) {
      event.preventDefault();
    }
  }

  return (
    <div className="space-y-8">
      <form action={updateAction} className="space-y-4" onSubmit={handleSubmit}>
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
          <label className={`block ${labelMediumClass}`}>내용</label>
          <div className="mt-1">
            <PostRichTextEditor
              editorRef={editorRef}
              placeholder="내용을 입력하세요"
              isEmpty={isContentEmpty}
              onInput={syncContent}
            />
          </div>
          <input ref={contentInputRef} type="hidden" name="content" defaultValue={initialContent} />
        </div>
        {updateState.error && <p className={errorTextClass}>{updateState.error}</p>}
        <button type="submit" disabled={updatePending || isContentEmpty} className={buttonPrimaryClass}>
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
