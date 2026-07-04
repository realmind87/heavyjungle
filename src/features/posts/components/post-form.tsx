"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { createPost, deletePost, updatePost, type PostActionState } from "@/features/posts/actions";
import { PostDraftPreview } from "@/features/posts/components/post-draft-preview";
import { PostRichTextEditor } from "@/features/posts/components/post-rich-text-editor";
import { createPostFormSchema, type PostCategory } from "@/features/posts/validators";
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
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);
  const [isContentEmpty, setIsContentEmpty] = useState(isPostHtmlEmpty(initialContent));
  const [isTitleEmpty, setIsTitleEmpty] = useState(initialTitle.trim() === "");
  const [category, setCategory] = useState<PostCategory>(initialCategory);
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");
  const [previewTitle, setPreviewTitle] = useState(initialTitle);
  const [previewHtml, setPreviewHtml] = useState(initialContent);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);

  useEffect(() => {
    if (!state.error) return;
    if (state.error.includes("제목")) {
      setTitleError(state.error);
      return;
    }
    if (state.error.includes("내용")) {
      setContentError(state.error);
      return;
    }
    setContentError(state.error);
  }, [state.error]);

  function clearFieldErrors() {
    setTitleError(null);
    setContentError(null);
  }

  function validateDraftFields(): boolean {
    syncContent();
    const title = titleInputRef.current?.value.trim() ?? "";
    const content = contentInputRef.current?.value ?? "";

    setIsTitleEmpty(title === "");
    setIsContentEmpty(isPostHtmlEmpty(content));

    let nextTitleError: string | null = null;
    let nextContentError: string | null = null;

    const parsed = createPostFormSchema.safeParse({
      title,
      content,
      category,
    });

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "title" && !nextTitleError) {
          nextTitleError = issue.message;
        }
        if (issue.path[0] === "content" && !nextContentError) {
          nextContentError = issue.message;
        }
      }
    }

    if (isPostHtmlEmpty(content)) {
      nextContentError = "내용을 입력하세요.";
    }

    setTitleError(nextTitleError);
    setContentError(nextContentError);

    if (nextTitleError || nextContentError) {
      return false;
    }

    setPreviewTitle(title);
    setPreviewHtml(content);
    return true;
  }

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
    setPreviewHtml(html);
    setIsContentEmpty(isPostHtmlEmpty(html));
  }

  function handleEditorModeChange(mode: "write" | "preview") {
    if (mode === "preview") {
      if (!validateDraftFields()) {
        setEditorMode("write");
        return;
      }
      clearFieldErrors();
      setEditorMode("preview");
      return;
    }

    clearFieldErrors();
    setEditorMode("write");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    syncContent();

    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (submitter instanceof HTMLButtonElement && submitter.dataset.action === "delete") {
      return;
    }

    if (!validateDraftFields()) {
      event.preventDefault();
      setEditorMode("write");
    }
  }

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {postId && <input type="hidden" name="postId" value={postId} />}
      <input type="hidden" name="category" value={isAdmin ? category : "general"} />

      {isAdmin && (
        <PostCategoryTabs value={category} onChange={setCategory} />
      )}

      <div className={editorMode === "preview" ? "hidden" : "relative"}>
        {(isTitleEmpty || titleError) && (
          <div
            aria-hidden={!titleError}
            role={titleError ? "alert" : undefined}
            className={`pointer-events-none absolute inset-0 box-border py-sm font-sans text-title-3 ${
              titleError ? "text-red-600 dark:text-red-400" : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {titleError ?? (
              <>
                {TITLE_PLACEHOLDER}
                <span className="text-red-600 dark:text-red-500">*</span>
              </>
            )}
          </div>
        )}
        <input
          ref={titleInputRef}
          id="title"
          name="title"
          maxLength={200}
          defaultValue={initialTitle}
          aria-label="제목 (필수)"
          aria-invalid={titleError ? true : undefined}
          onInput={(event) => {
            setIsTitleEmpty(event.currentTarget.value.trim() === "");
            setTitleError(null);
          }}
          className="relative box-border block w-full m-0 py-sm px-0 border-0 bg-transparent font-bold outline-none resize-none overflow-y-hidden font-sans text-2xl text-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div className={editorMode === "preview" ? "hidden" : undefined}>
        <PostRichTextEditor
          editorRef={editorRef}
          placeholder={CONTENT_PLACEHOLDER}
          isEmpty={isContentEmpty}
          errorMessage={contentError}
          onInput={() => {
            syncContent();
            setContentError(null);
          }}
        />
      </div>
      {editorMode === "preview" && (
        <PostDraftPreview title={previewTitle} html={previewHtml} />
      )}
      <input ref={contentInputRef} type="hidden" name="content" defaultValue={initialContent} />
      <div className="flex items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label="본문 작성 모드"
          className="inline-flex shrink-0 rounded-lg border border-zinc-200 p-1 dark:border-zinc-700"
        >
          {(
            [
              { id: "write" as const, label: "작성" },
              { id: "preview" as const, label: "미리보기" },
            ] as const
          ).map((tab) => {
            const isActive = editorMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleEditorModeChange(tab.id)}
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
        <Link href={cancelHref} className={`${buttonSecondaryClass} ml-auto`}>
          취소
        </Link>
        <button type="submit" disabled={pending || isContentEmpty || isTitleEmpty} className={buttonPrimaryClass}>
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
