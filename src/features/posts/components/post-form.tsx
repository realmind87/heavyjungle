"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { createPost, deletePost, updatePost, type PostActionState } from "@/features/posts/actions";
import { PostRichTextEditor } from "@/features/posts/components/post-rich-text-editor";
import type { PostCategory } from "@/features/posts/validators";
import { isPostHtmlEmpty } from "@/lib/sanitize-post-html";
import {
  buttonDangerClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  errorTextClass,
} from "@/lib/ui-classes";

const CONTENT_PLACEHOLDER = "내용을 입력하세요";
const TITLE_PLACEHOLDER = "제목을 입력하세요";

const CATEGORY_TABS: Array<{ id: PostCategory; label: string }> = [
  { id: "general", label: "일반게시글" },
  { id: "notice", label: "공지사항" },
];

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
  initialCategory?: PostCategory;
  isAdmin?: boolean;
  deleteAction?: (payload: FormData) => void;
  deletePending?: boolean;
  deleteState?: PostActionState;
};

function PostCategoryTabs({
  value,
  onChange,
}: {
  value: PostCategory;
  onChange: (category: PostCategory) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="게시글 분류"
      className="inline-flex rounded-lg border border-zinc-200 p-1 dark:border-zinc-700"
    >
      {CATEGORY_TABS.map((tab) => {
        const isActive = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              isActive
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

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
  initialCategory = "general",
  isAdmin = false,
  deleteAction,
  deletePending = false,
  deleteState,
}: PostFormBodyProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const contentInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);
  const [isContentEmpty, setIsContentEmpty] = useState(isPostHtmlEmpty(initialContent));
  const [isTitleEmpty, setIsTitleEmpty] = useState(initialTitle.trim() === "");
  const [category, setCategory] = useState<PostCategory>(initialCategory);

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

    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (submitter instanceof HTMLButtonElement && submitter.dataset.action === "delete") {
      return;
    }

    const html = contentInputRef.current?.value ?? "";
    if (isPostHtmlEmpty(html)) {
      event.preventDefault();
    }
  }

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {postId && <input type="hidden" name="postId" value={postId} />}
      <input type="hidden" name="category" value={isAdmin ? category : "general"} />

      {isAdmin && (
        <PostCategoryTabs value={category} onChange={setCategory} />
      )}

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
          className="relative box-border block w-full m-0 py-sm px-0 border-0 bg-transparent font-bold outline-none resize-none overflow-y-hidden font-sans text-2xl text-zinc-900 dark:text-zinc-50"
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
      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className={buttonSecondaryClass}>
          취소
        </Link>
        <button type="submit" disabled={pending || isContentEmpty} className={buttonPrimaryClass}>
          {pending ? pendingLabel : submitLabel}
        </button>
        {deleteAction && (
          <button
            type="submit"
            formAction={deleteAction}
            data-action="delete"
            disabled={deletePending}
            className={buttonDangerClass}
          >
            {deletePending ? "삭제 중..." : "글 삭제"}
          </button>
        )}
      </div>
      {deleteState?.error && <p className={errorTextClass}>{deleteState.error}</p>}
    </form>
  );
}

type PostFormProps =
  | { mode: "create"; cancelHref?: string; isAdmin?: boolean }
  | {
      mode: "edit";
      postId: string;
      initialTitle: string;
      initialContent: string;
      initialCategory?: PostCategory;
      cancelHref?: string;
      isAdmin?: boolean;
    };

function PostFormCreate({
  cancelHref = "/",
  isAdmin = false,
}: {
  cancelHref?: string;
  isAdmin?: boolean;
}) {
  const [state, formAction, pending] = useActionState(createPost, {} as PostActionState);

  return (
    <PostFormBody
      formAction={formAction}
      pending={pending}
      state={state}
      cancelHref={cancelHref}
      submitLabel="등록"
      pendingLabel="등록 중..."
      isAdmin={isAdmin}
    />
  );
}

function PostFormEdit({
  postId,
  initialTitle,
  initialContent,
  initialCategory = "general",
  cancelHref,
  isAdmin = false,
}: {
  postId: string;
  initialTitle: string;
  initialContent: string;
  initialCategory?: PostCategory;
  cancelHref: string;
  isAdmin?: boolean;
}) {
  const [state, formAction, pending] = useActionState(updatePost, {} as PostActionState);
  const [deleteState, deleteAction, deletePending] = useActionState(deletePost, {} as PostActionState);

  return (
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
      initialCategory={initialCategory}
      isAdmin={isAdmin}
      deleteAction={deleteAction}
      deletePending={deletePending}
      deleteState={deleteState}
    />
  );
}

/** 글 작성·수정 공용 폼 */
export function PostForm(props: PostFormProps) {
  if (props.mode === "create") {
    return <PostFormCreate cancelHref={props.cancelHref} isAdmin={props.isAdmin} />;
  }

  return (
    <PostFormEdit
      postId={props.postId}
      initialTitle={props.initialTitle}
      initialContent={props.initialContent}
      initialCategory={props.initialCategory}
      cancelHref={props.cancelHref ?? `/posts/${props.postId}`}
      isAdmin={props.isAdmin}
    />
  );
}
