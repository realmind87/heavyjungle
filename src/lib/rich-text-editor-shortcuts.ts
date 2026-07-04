import type { KeyboardEvent } from "react";

const INDENT_STEP_EM = 2;
const MAX_INDENT_EM = 10;

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

function getCaretBlock(editor: HTMLElement): HTMLElement | null {
  const range = getSelectionRange();
  if (!range || !editor.contains(range.commonAncestorContainer)) return null;

  const block = findBlockInEditor(range.commonAncestorContainer, editor);
  return block === editor ? null : block;
}

function ensureCaretBlock(editor: HTMLElement): HTMLElement | null {
  const range = getSelectionRange();
  if (!range || !editor.contains(range.commonAncestorContainer)) return null;

  const block = findBlockInEditor(range.commonAncestorContainer, editor);
  if (block !== editor) return block;

  const wrapper = document.createElement("div");
  if (editor.childNodes.length === 0) {
    wrapper.appendChild(document.createElement("br"));
    editor.appendChild(wrapper);
  } else if (range.collapsed) {
    const anchor = range.startContainer;
    const offset = range.startOffset;

    if (anchor === editor) {
      wrapper.appendChild(document.createElement("br"));
      const ref = offset < editor.childNodes.length ? editor.childNodes[offset] : null;
      editor.insertBefore(wrapper, ref);
    } else {
      let target: Node = anchor;
      if (target.nodeType === Node.TEXT_NODE && target.parentNode) {
        target = target.parentNode;
      }
      if (target.parentNode === editor && target instanceof HTMLElement) {
        editor.insertBefore(wrapper, target);
        wrapper.appendChild(target);
      } else {
        wrapper.appendChild(document.createElement("br"));
        range.insertNode(wrapper);
      }
    }
  } else {
    return null;
  }

  const caret = document.createRange();
  caret.selectNodeContents(wrapper);
  caret.collapse(false);
  restoreSelection(caret);
  return wrapper;
}

function getBlockPaddingLeftEm(block: HTMLElement): number {
  const raw = block.style.paddingLeft.trim().toLowerCase();
  const match = raw.match(/^([\d.]+)em$/);
  return match ? parseFloat(match[1]) : 0;
}

function setBlockPaddingLeftEm(block: HTMLElement, em: number) {
  if (em <= 0) {
    block.style.removeProperty("padding-left");
    return;
  }
  block.style.setProperty("padding-left", `${em}em`);
}

function isCaretAtBlockStart(editor: HTMLElement, block: HTMLElement): boolean {
  const range = getSelectionRange();
  if (!range?.collapsed || !editor.contains(range.commonAncestorContainer)) {
    return false;
  }

  const probe = document.createRange();
  probe.selectNodeContents(block);
  probe.setEnd(range.endContainer, range.endOffset);

  return probe.toString().replace(/\u200B/g, "").length === 0;
}

export function indentEditorSelection(editor: HTMLElement, outdent: boolean): boolean {
  const block = outdent ? getCaretBlock(editor) : ensureCaretBlock(editor);
  if (!block) return false;

  const current = getBlockPaddingLeftEm(block);
  const next = outdent
    ? Math.max(0, current - INDENT_STEP_EM)
    : Math.min(MAX_INDENT_EM, current + INDENT_STEP_EM);

  if (next === current) return false;

  setBlockPaddingLeftEm(block, next);
  return true;
}

export function insertSoftLineBreak(): boolean {
  const range = getSelectionRange();
  if (!range) return false;

  const br = document.createElement("br");
  range.deleteContents();
  range.insertNode(br);

  const trailing = document.createTextNode("\u200B");
  br.parentNode?.insertBefore(trailing, br.nextSibling);

  const caret = document.createRange();
  caret.setStart(trailing, 1);
  caret.collapse(true);
  restoreSelection(caret);
  return true;
}

export type RichTextShortcutHandlers = {
  onBold: () => void;
  onItalic: () => void;
  onStrikethrough: () => void;
  onLink: () => void;
  onInput: () => void;
};

export function handleRichTextEditorKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  editor: HTMLElement,
  handlers: RichTextShortcutHandlers,
): void {
  if (event.key === "Backspace" && !event.metaKey && !event.ctrlKey && !event.altKey) {
    const block = getCaretBlock(editor);
    if (
      block &&
      getBlockPaddingLeftEm(block) > 0 &&
      isCaretAtBlockStart(editor, block)
    ) {
      event.preventDefault();
      if (indentEditorSelection(editor, true)) {
        handlers.onInput();
      }
      return;
    }
  }

  if (event.key === "Tab") {
    event.preventDefault();
    if (indentEditorSelection(editor, event.shiftKey)) {
      handlers.onInput();
    }
    return;
  }

  if (event.key === "Enter" && event.shiftKey) {
    event.preventDefault();
    if (insertSoftLineBreak()) {
      handlers.onInput();
    }
    return;
  }

  const isMod = event.metaKey || event.ctrlKey;
  if (!isMod || event.altKey) return;

  const key = event.key.toLowerCase();

  switch (key) {
    case "b":
      event.preventDefault();
      handlers.onBold();
      break;
    case "i":
      event.preventDefault();
      handlers.onItalic();
      break;
    case "k":
      event.preventDefault();
      handlers.onLink();
      break;
    case "s":
      if (event.shiftKey) {
        event.preventDefault();
        handlers.onStrikethrough();
      }
      break;
    default:
      break;
  }
}
