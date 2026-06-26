"use client";

import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

const FONT_SIZES = [
  { label: "작게", value: "14px" },
  { label: "보통", value: "16px" },
  { label: "크게", value: "20px" },
  { label: "제목", value: "24px" },
] as const;

type PostRichTextEditorProps = {
  editorRef: RefObject<HTMLDivElement | null>;
  placeholder: string;
  isEmpty: boolean;
  onInput: () => void;
};

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

/** surroundContents 실패 시(여러 블록 선택 등) extractContents 로 감싸기 */
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

function saveSelectionInEditor(editor: HTMLElement | null, savedRange: { current: Range | null }) {
  if (!editor) {
    savedRange.current = null;
    return;
  }

  const range = getSelectionRange();
  if (!range || !editor.contains(range.commonAncestorContainer)) {
    savedRange.current = null;
    return;
  }

  savedRange.current = range.cloneRange();
}

function restoreSavedSelection(savedRange: { current: Range | null }, editor: HTMLElement) {
  if (savedRange.current) {
    restoreSelection(savedRange.current);
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  restoreSelection(range);
}

function wrapSelectionWithSpan(styles: Partial<CSSStyleDeclaration>) {
  const range = getSelectionRange();
  if (!range) return;

  const span = document.createElement("span");
  Object.assign(span.style, styles);

  if (range.collapsed) {
    span.appendChild(document.createTextNode("\u200B"));
    range.insertNode(span);
    const caret = document.createRange();
    caret.setStart(span.firstChild!, 1);
    caret.collapse(true);
    restoreSelection(caret);
    return;
  }

  wrapRangeWithElement(range, span);
}

function toggleInlineTag(tagName: "strong" | "em") {
  const range = getSelectionRange();
  if (!range || range.collapsed) return;
  wrapRangeWithElement(range, document.createElement(tagName));
}

function findBlockInEditor(node: Node, editor: HTMLElement): HTMLElement {
  let current: Node | null = node;
  while (current && current !== editor) {
    if (current instanceof HTMLElement) {
      const { display } = window.getComputedStyle(current);
      if (display === "block" || current.tagName === "DIV" || current.tagName === "P") {
        return current;
      }
    }
    current = current.parentNode;
  }
  return editor;
}

function applyTextAlign(editor: HTMLElement, align: "left" | "center" | "right") {
  const range = getSelectionRange();
  if (!range) return;
  const block = findBlockInEditor(range.commonAncestorContainer, editor);
  block.style.textAlign = align;
}

type ToolbarButtonProps = {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({ label, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={preventToolbarBlur}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}

type FontSizePickerProps = {
  onBeforeOpen: () => void;
  onSelect: (size: string) => void;
};

function FontSizePicker({ onBeforeOpen, onSelect }: FontSizePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLabel, setActiveLabel] = useState("크기");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="글자 크기"
        onPointerDown={onBeforeOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-8 min-w-[4.5rem] items-center justify-between gap-1 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <span>{activeLabel}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label="글자 크기 선택"
          className="absolute left-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {FONT_SIZES.map((size) => (
            <li key={size.value} role="option" aria-selected={activeLabel === size.label}>
              <button
                type="button"
                onMouseDown={preventToolbarBlur}
                onClick={() => {
                  onSelect(size.value);
                  setActiveLabel(size.label);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${activeLabel === size.label ? "bg-zinc-50 dark:bg-zinc-800" : ""
                  }`}
              >
                <span className="text-xs text-zinc-600 dark:text-zinc-300">{size.label}</span>
                <span className="text-zinc-900 dark:text-zinc-100" style={{ fontSize: size.value }}>
                  가
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PostRichTextEditor({
  editorRef,
  placeholder,
  isEmpty,
  onInput,
}: PostRichTextEditorProps) {
  const savedRangeRef = useRef<Range | null>(null);

  const focusEditor = useCallback(() => {
    editorRef.current?.focus();
  }, [editorRef]);

  const applyFontSize = useCallback(
    (size: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      editor.focus();
      restoreSavedSelection(savedRangeRef, editor);
      wrapSelectionWithSpan({ fontSize: size });
      onInput();
    },
    [editorRef, onInput],
  );

  const handleFontSizePointerDown = useCallback(() => {
    saveSelectionInEditor(editorRef.current, savedRangeRef);
  }, [editorRef]);

  const applyColor = useCallback(
    (color: string) => {
      focusEditor();
      wrapSelectionWithSpan({ color });
      onInput();
    },
    [focusEditor, onInput],
  );

  const applyAlign = useCallback(
    (align: "left" | "center" | "right") => {
      const editor = editorRef.current;
      if (!editor) return;
      focusEditor();
      applyTextAlign(editor, align);
      onInput();
    },
    [editorRef, focusEditor, onInput],
  );

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div
        role="toolbar"
        aria-label="서식 도구"
        className="flex flex-wrap items-center gap-1 border-b border-zinc-200 p-2 dark:border-zinc-700"
      >
        <FontSizePicker onBeforeOpen={handleFontSizePointerDown} onSelect={applyFontSize} />

        <ToolbarButton
          label="굵게"
          onClick={() => {
            focusEditor();
            toggleInlineTag("strong");
            onInput();
          }}
        >
          <span className="font-bold">B</span>
        </ToolbarButton>

        <ToolbarButton
          label="기울임"
          onClick={() => {
            focusEditor();
            toggleInlineTag("em");
            onInput();
          }}
        >
          <span className="italic">I</span>
        </ToolbarButton>

        <div className="flex items-center gap-1">
          <label className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md dark:border-zinc-700">
            <span className="sr-only">글자 색상</span>
            <input
              type="color"
              className="absolute inset-0 cursor-pointer opacity-0"
              onMouseDown={preventToolbarBlur}
              onChange={(event) => applyColor(event.target.value)}
            />
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-500" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"
              />
            </svg>
          </label>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <ToolbarButton label="왼쪽 정렬" onClick={() => applyAlign("left")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" d="M4 6h16M4 12h10M4 18h14" />
            </svg>
          </ToolbarButton>
          <ToolbarButton label="가운데 정렬" onClick={() => applyAlign("center")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" d="M4 6h16M7 12h10M5 18h14" />
            </svg>
          </ToolbarButton>
          <ToolbarButton label="오른쪽 정렬" onClick={() => applyAlign("right")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" d="M4 6h16M10 12h10M6 18h14" />
            </svg>
          </ToolbarButton>
        </div>
      </div>

      <div className="relative">
        {isEmpty && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 px-3 py-2 font-sans text-base text-zinc-400 dark:text-zinc-500"
          >
            {placeholder}
            <span className="text-red-600 dark:text-red-500">*</span>
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
          className="min-h-[200px] px-3 py-2 font-sans text-base text-zinc-900 outline-none dark:text-zinc-100 [&_div]:min-h-[1.5em]"
        />
      </div>
    </div>
  );
}
