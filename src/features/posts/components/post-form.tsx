"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { createPost, deletePost, updatePost, type PostActionState } from "@/features/posts/actions";
import { PostRichTextEditor } from "@/features/posts/components/post-rich-text-editor";
import { isPostHtmlEmpty } from "@/lib/sanitize-post-html";
import {
  buttonDangerClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  errorTextClass,
} from "@/lib/ui-classes";

const CONTENT_PLACEHOLDER = "내용을 입력하세요";
const TITLE_PLACEHOLDER = "제목을 입력하세요";

type PostFormBodyProps = {
  formAction: (payload: FormData) => void;
  pending: boolean;
  state: PostActionState;
  cancelHref: string;
  submitLabel: string;
  pendingLabel: string;
  postId?: string;
  initialTitle?: string;
  initialContent?: string;
};

function PostFormBody({
  formAction,
  pending,
  state,
  cancelHref,
  submitLabel,
  pendingLabel,
  postId,
  initialTitle = "",
  initialContent = "",
}: PostFormBodyProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const contentInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);
  const [isContentEmpty, setIsContentEmpty] = useState(isPostHtmlEmpty(initialContent));
  const [isTitleEmpty, setIsTitleEmpty] = useState(initialTitle.trim() === "");

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || initializedRef.current || !initialContent) return;
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
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {postId && <input type="hidden" name="postId" value={postId} />}
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
          defaultValue={initialTitle}
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
      <input ref={contentInputRef} type="hidden" name="content" defaultValue={initialContent} />
      {state.error && <p className={errorTextClass}>{state.error}</p>}
      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className={buttonSecondaryClass}>
          취소
        </Link>
        <button type="submit" disabled={pending || isContentEmpty} className={buttonPrimaryClass}>
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}

type PostFormProps =
  | { mode: "create"; cancelHref?: string }
  | {
      mode: "edit";
      postId: string;
      initialTitle: string;
      initialContent: string;
      cancelHref?: string;
    };

function PostFormCreate({ cancelHref = "/" }: { cancelHref?: string }) {
  const [state, formAction, pending] = useActionState(createPost, {} as PostActionState);

  return (
    <PostFormBody
      formAction={formAction}
      pending={pending}
      state={state}
      cancelHref={cancelHref}
      submitLabel="등록"
      pendingLabel="등록 중..."
    />
  );
}

function PostFormEdit({
  postId,
  initialTitle,
  initialContent,
  cancelHref,
}: {
  postId: string;
  initialTitle: string;
  initialContent: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(updatePost, {} as PostActionState);
  const [deleteState, deleteAction, deletePending] = useActionState(deletePost, {} as PostActionState);

  return (
    <div className="space-y-8">
      <PostFormBody
        formAction={formAction}
        pending={pending}
        state={state}
        cancelHref={cancelHref}
        submitLabel="저장"
        pendingLabel="저장 중..."
        postId={postId}
        initialTitle={initialTitle}
        initialContent={initialContent}
      />

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

/** 글 작성·수정 공용 폼 */
export function PostForm(props: PostFormProps) {
  if (props.mode === "create") {
    return <PostFormCreate cancelHref={props.cancelHref} />;
  }

  return (
    <PostFormEdit
      postId={props.postId}
      initialTitle={props.initialTitle}
      initialContent={props.initialContent}
      cancelHref={props.cancelHref ?? `/posts/${props.postId}`}
    />
  );
}
