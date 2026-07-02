"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { createPost, type PostActionState } from "@/features/posts/actions";
import { PostRichTextEditor } from "@/features/posts/components/post-rich-text-editor";
import { isPostHtmlEmpty } from "@/lib/sanitize-post-html";
import { buttonPrimaryClass, buttonSecondaryClass, errorTextClass } from "@/lib/ui-classes";

const CONTENT_PLACEHOLDER = "내용을 입력하세요";
const TITLE_PLACEHOLDER = "제목을 입력하세요";

/** 글 작성 폼 — Server Action + useActionState */
export function PostCreateForm() {
  const [state, formAction, pending] = useActionState(createPost, {} as PostActionState);
  const editorRef = useRef<HTMLDivElement>(null);
  const contentInputRef = useRef<HTMLInputElement>(null);
  const [isContentEmpty, setIsContentEmpty] = useState(true);
  const [isTitleEmpty, setIsTitleEmpty] = useState(true);

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
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      <div className="relative">
        {isTitleEmpty && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 box-border py-sm font-sans text-title-3 text-zinc-400 dark:text-zinc-500"
          >
            {TITLE_PLACEHOLDER}
            <span className="text-red-600 dark:text-red-500">*</span>
          </div>
        )}
        <input
          id="title"
          name="title"
          maxLength={200}
          aria-label="제목 (필수)"
          onInput={(event) => setIsTitleEmpty(event.currentTarget.value.trim() === "")}
          className="relative box-border block w-full m-0 py-sm px-0 border-0 bg-transparent outline-none resize-none overflow-y-hidden font-sans text-title-3 text-zinc-900 dark:text-zinc-50"
        />
      </div>
      {state.error && <p className={errorTextClass}>{state.error}</p>}

      <PostRichTextEditor
        editorRef={editorRef}
        placeholder={CONTENT_PLACEHOLDER}
        isEmpty={isContentEmpty}
        onInput={syncContent}
      />
      <input ref={contentInputRef} type="hidden" name="content" defaultValue="" />
      {state.error && <p className={errorTextClass}>{state.error}</p>}
      <div className="flex justify-end gap-2">
        <Link href="/" className={buttonSecondaryClass}>
          취소
        </Link>
        <button type="submit" disabled={pending || isContentEmpty} className={buttonPrimaryClass}>
          {pending ? "등록 중..." : "등록"}
        </button>
      </div>
    </form>
  );
}
