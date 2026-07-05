"use client";

import { type RefObject, useCallback, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import { createCommentImageUploadUrl, deleteCommentImage } from "@/features/uploads/actions";
import {
  COMMENT_IMAGE_ALLOWED_CONTENT_TYPES,
  COMMENT_IMAGE_MAX_BYTES,
  resolveCommentImageContentType,
} from "@/features/uploads/constants";
import { prepareEditorImage, insertEditorBlockWithCaretLine, useRichTextImageControls } from "@/lib/rich-text-editor-image";
import { EditorImageOverlay } from "@/lib/rich-text-editor-image-overlay";
import { buttonPrimaryClass } from "@/lib/ui-classes";

function preventToolbarBlur(event: React.MouseEvent) {
  event.preventDefault();
}

function getSelectionRange(): Range | null {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  return selection.getRangeAt(0);
}

function restoreSelection(range: Range) {
  const selection = window.getSelection();
  if (!selection) return;
  selection.removeAllRanges();
  selection.addRange(range);
}

function wrapRangeWithElement(range: Range, element: HTMLElement) {
  try {
    range.surroundContents(element);
    return;
  } catch {
    const contents = range.extractContents();
    element.appendChild(contents);
    range.insertNode(element);
  }

  const wrapped = document.createRange();
  wrapped.selectNodeContents(element);
  restoreSelection(wrapped);
}

function normalizeLinkUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

type CommentRichTextEditorProps = {
  editorRef: RefObject<HTMLDivElement | null>;
  placeholder: string;
  isEmpty: boolean;
  onInput: () => void;
  minHeightClass?: string;
  autoFocus?: boolean;
  submitLabel?: string;
  submitPending?: boolean;
  onCancel?: () => void;
  compact?: boolean;
};

type ToolbarButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
};

function ToolbarButton({ label, onClick, disabled, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={preventToolbarBlur}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}

export function CommentRichTextEditor({
  editorRef,
  placeholder,
  isEmpty,
  onInput,
  minHeightClass = "min-h-[4.5rem]",
  autoFocus = false,
  submitLabel = "등록",
  submitPending = false,
  onCancel,
  compact = false,
}: CommentRichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { selectedImage, removeSelectedImage, deleteButtonPosition, resizeHandlePosition, startImageResize } =
    useRichTextImageControls({
    editorRef,
    storagePrefix: "comments",
    onInput,
    deleteImage: deleteCommentImage,
  });

  const focusEditor = useCallback(() => {
    editorRef.current?.focus();
  }, [editorRef]);

  const insertLink = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const urlInput = window.prompt("링크 URL을 입력하세요 (https://...)");
    const url = urlInput ? normalizeLinkUrl(urlInput) : null;
    if (!url) {
      if (urlInput?.trim()) {
        toast.error("http:// 또는 https:// 로 시작하는 URL만 사용할 수 있습니다.");
      }
      return;
    }

    focusEditor();
    const range = getSelectionRange();
    if (!range) return;

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";

    if (range.collapsed) {
      anchor.textContent = url;
      range.insertNode(anchor);
      const caret = document.createRange();
      caret.setStartAfter(anchor);
      caret.collapse(true);
      restoreSelection(caret);
    } else {
      wrapRangeWithElement(range, anchor);
    }

    onInput();
  }, [editorRef, focusEditor, onInput]);

  const insertImageAtCursor = useCallback(
    (publicUrl: string, alt: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      focusEditor();
      const range = getSelectionRange();

      const image = document.createElement("img");
      image.src = publicUrl;
      image.alt = alt;
      image.className = "my-1 block max-w-full h-auto rounded-md";
      prepareEditorImage(image);

      insertEditorBlockWithCaretLine(editor, range, image, restoreSelection);

      onInput();
    },
    [editorRef, focusEditor, onInput],
  );

  const handleImageFile = useCallback(
    async (file: File) => {
      const contentType = resolveCommentImageContentType(file);
      if (!contentType) {
        toast.error("JPEG, PNG, WebP, GIF 이미지만 업로드할 수 있습니다.");
        return;
      }

      if (file.size > COMMENT_IMAGE_MAX_BYTES) {
        toast.error("파일 크기는 5MB 이하여야 합니다.");
        return;
      }

      setUploadingImage(true);

      const intent = await createCommentImageUploadUrl({
        filename: file.name,
        contentType,
        size: file.size,
      });

      if ("error" in intent) {
        toast.error(intent.error);
        setUploadingImage(false);
        return;
      }

      const putResponse = await fetch(intent.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": contentType },
      });

      if (!putResponse.ok) {
        toast.error("이미지 업로드에 실패했습니다.");
        setUploadingImage(false);
        return;
      }

      insertImageAtCursor(intent.publicUrl, file.name);
      setUploadingImage(false);
    },
    [insertImageAtCursor],
  );



  return (
    <div>
      <div className="relative">
        {isEmpty && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 text-sm text-zinc-400 dark:text-zinc-500"
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-placeholder={placeholder}
          contentEditable
          suppressContentEditableWarning
          onInput={onInput}
          onPaste={(event) => {
            event.preventDefault();
            const text = event.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
            onInput();
          }}
          autoFocus={autoFocus}
          className={`${minHeightClass} w-full text-sm text-zinc-900 outline-none dark:text-zinc-50 [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400 [&_img]:my-1 [&_img]:block [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_img]:cursor-pointer [&_img.editor-image-selected]:outline [&_img.editor-image-selected]:outline-2 [&_img.editor-image-selected]:outline-blue-500 [&_img.editor-image-selected]:outline-offset-2`}
        />
        {selectedImage && (
          <EditorImageOverlay
            showResize={selectedImage instanceof HTMLImageElement}
            deletePosition={deleteButtonPosition}
            resizePosition={resizeHandlePosition}
            onDelete={removeSelectedImage}
            onResizePointerDown={startImageResize}
            compact
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div
          role="toolbar"
          aria-label="댓글 도구"
          className="flex items-center gap-0.5"
        >
          <ToolbarButton label="링크 삽입" onClick={insertLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
              />
            </svg>
          </ToolbarButton>

          <ToolbarButton
            label="이미지 삽입"
            disabled={uploadingImage}
            onClick={() => imageInputRef.current?.click()}
          >
            {uploadingImage ? (
              <span className="text-[10px]">…</span>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 15-5-5L5 21" />
              </svg>
            )}
          </ToolbarButton>

          <input
            ref={imageInputRef}
            type="file"
            accept={[...COMMENT_IMAGE_ALLOWED_CONTENT_TYPES, ".gif"].join(",")}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void handleImageFile(file);
            }}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:border-zinc-700 dark:hover:text-zinc-300"
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={submitPending || isEmpty}
            className={
              compact
                ? "rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100"
                : buttonPrimaryClass
            }
          >
            {submitPending ? "등록 중..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
