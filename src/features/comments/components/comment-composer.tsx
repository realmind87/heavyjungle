"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createComment, type CommentActionState } from "@/features/comments/actions";
import { CommentRichTextEditor } from "@/features/comments/components/comment-rich-text-editor";
import { isCommentHtmlEmpty } from "@/lib/sanitize-comment-html";
import { buttonPrimaryClass, errorTextClass } from "@/lib/ui-classes";

type CommentComposerProps = {
  postId: string;
  parentId?: string;
  placeholder?: string;
  submitLabel?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
};

/** 댓글·답글 공통 작성 폼 */
export function CommentComposer({
  postId,
  parentId,
  placeholder = "댓글을 입력하세요",
  submitLabel = "등록",
  onCancel,
  autoFocus = false,
  compact = false,
}: CommentComposerProps) {
  const [state, formAction, pending] = useActionState(createComment, {} as CommentActionState);
  const editorRef = useRef<HTMLDivElement>(null);
  const contentInputRef = useRef<HTMLInputElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  function syncContent() {
    const editor = editorRef.current;
    const input = contentInputRef.current;
    if (!editor || !input) return;
    const html = editor.innerHTML;
    input.value = html;
    setIsEmpty(isCommentHtmlEmpty(html));
  }

  useEffect(() => {
    if (!state.error) return;
    syncContent();
  }, [state.error]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    syncContent();
    const html = contentInputRef.current?.value ?? "";
    if (isCommentHtmlEmpty(html)) {
      event.preventDefault();
    }
  }

  const editor = (
    <CommentRichTextEditor
      editorRef={editorRef}
      placeholder={placeholder}
      isEmpty={isEmpty}
      onInput={syncContent}
      minHeightClass={compact ? "min-h-[3rem]" : "min-h-[4.5rem]"}
      autoFocus={autoFocus}
    />
  );

  const actions = (
    <div className={`flex items-center gap-1 ${compact ? "" : "justify-end"}`}>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          취소
        </button>
      )}
      <button
        type="submit"
        disabled={pending || isEmpty}
        className={
          compact
            ? "border border-zinc-200 rounded-lg px-3 py-2 text-xs font-medium text-zinc-900 disabled:opacity-50 dark:text-zinc-100"
            : buttonPrimaryClass
        }
      >
        {pending ? "등록 중..." : submitLabel}
      </button>
    </div>
  );

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className={compact ? "space-y-2" : "space-y-2"}
    >
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <input ref={contentInputRef} type="hidden" name="content" defaultValue="" />

      {compact ? (
        <>
          {editor}
          {state.error && <p className={`text-xs ${errorTextClass}`}>{state.error}</p>}
          {actions}
        </>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
          {editor}
          {state.error && <p className={errorTextClass}>{state.error}</p>}
          {actions}
        </div>
      )}
    </form>
  );
}
