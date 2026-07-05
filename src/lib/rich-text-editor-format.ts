/** contentEditable 서식 — 일반 WYSIWYG 에디터 패턴 */

export type SavedSelectionRef = { current: Range | null };

export type TextSegment = {
  node: Text;
  start: number;
  end: number;
};

export function getSelectionRange(): Range | null {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  return selection.getRangeAt(0);
}

export function restoreSelection(range: Range) {
  const selection = window.getSelection();
  if (!selection) return;
  selection.removeAllRanges();
  selection.addRange(range);
}

export function saveSelectionInEditor(editor: HTMLElement | null, saved: SavedSelectionRef) {
  if (!editor) {
    saved.current = null;
    return;
  }

  const range = getSelectionRange();
  if (!range || !editor.contains(range.commonAncestorContainer)) {
    saved.current = null;
    return;
  }

  saved.current = range.cloneRange();
}

/** 툴바 클릭 전 선택 저장 — mousedown에서 호출 */
export function saveEditorSelection(editor: HTMLElement | null, saved: SavedSelectionRef) {
  saveSelectionInEditor(editor, saved);
}

/** 포커스 복원 + 저장된 선택 복원 */
export function prepareEditorSelection(editor: HTMLElement, saved: SavedSelectionRef): Range | null {
  editor.focus({ preventScroll: true });

  if (saved.current) {
    try {
      restoreSelection(saved.current);
    } catch {
      saved.current = null;
    }
  }

  const range = getSelectionRange();
  if (!range || !editor.contains(range.commonAncestorContainer)) {
    return null;
  }

  return range;
}

export function wrapRangeWithElement(range: Range, element: HTMLElement) {
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

function applyStylesToElement(element: HTMLElement, styles: Record<string, string>) {
  for (const [key, value] of Object.entries(styles)) {
    const prop = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
    element.style.setProperty(prop, value);
  }
}

function isBlockElement(node: HTMLElement, editor: HTMLElement): boolean {
  if (node === editor) return false;
  return node.tagName === "DIV" || node.tagName === "P";
}

function getBlockElementsInRange(editor: HTMLElement, range: Range): HTMLElement[] {
  const blocks: HTMLElement[] = [];

  for (const child of editor.children) {
    if (!(child instanceof HTMLElement) || !isBlockElement(child, editor)) continue;
    try {
      if (range.intersectsNode(child)) blocks.push(child);
    } catch {
      // ignore
    }
  }

  if (blocks.length > 0) return blocks;

  let current: Node | null = range.commonAncestorContainer;
  while (current && current !== editor) {
    if (current instanceof HTMLElement && isBlockElement(current, editor)) {
      return [current];
    }
    current = current.parentNode;
  }

  return [];
}

function isBlockFullySelected(block: HTMLElement, range: Range): boolean {
  const blockRange = document.createRange();
  blockRange.selectNodeContents(block);
  return (
    range.compareBoundaryPoints(Range.START_TO_START, blockRange) <= 0 &&
    range.compareBoundaryPoints(Range.END_TO_END, blockRange) >= 0
  );
}

export function getTextSegmentsInRange(editor: HTMLElement, range: Range): TextSegment[] {
  const segments: TextSegment[] = [];

  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node as Text;
      if (!text.data.length) return NodeFilter.FILTER_REJECT;
      try {
        if (!range.intersectsNode(text)) return NodeFilter.FILTER_REJECT;
      } catch {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let current = walker.nextNode() as Text | null;
  while (current) {
    let start = 0;
    let end = current.length;
    if (current === range.startContainer) start = range.startOffset;
    if (current === range.endContainer) end = range.endOffset;
    if (start < end) segments.push({ node: current, start, end });
    current = walker.nextNode() as Text | null;
  }

  return segments;
}

function applyStylesToTextSegments(range: Range, styles: Record<string, string>) {
  const editor = range.commonAncestorContainer;
  const root =
    editor instanceof HTMLElement
      ? editor
      : editor.parentElement?.closest("[contenteditable]");

  if (!(root instanceof HTMLElement)) return;

  const segments = getTextSegmentsInRange(root, range);
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index];
    const subRange = document.createRange();
    subRange.setStart(segment.node, segment.start);
    subRange.setEnd(segment.node, segment.end);

    const span = document.createElement("span");
    applyStylesToElement(span, styles);
    wrapRangeWithElement(subRange, span);
  }
}

function insertCollapsedStyleSpan(range: Range, styles: Record<string, string>) {
  const span = document.createElement("span");
  applyStylesToElement(span, styles);
  span.appendChild(document.createTextNode("\u200B"));
  range.insertNode(span);

  const caret = document.createRange();
  caret.setStart(span.firstChild!, 1);
  caret.collapse(true);
  restoreSelection(caret);
}

/** px 글자 크기 — 전체 선택·여러 줄·부분 선택 지원 */
export function applyFontSizePx(editor: HTMLElement, size: string, range: Range) {
  if (range.collapsed) {
    insertCollapsedStyleSpan(range, { fontSize: size });
    return;
  }

  const blocks = getBlockElementsInRange(editor, range);
  const canStyleBlocks =
    blocks.length > 0 && blocks.every((block) => isBlockFullySelected(block, range));

  if (canStyleBlocks) {
    for (const block of blocks) {
      block.style.setProperty("font-size", size);
    }
    return;
  }

  applyStylesToTextSegments(range, { fontSize: size });
}

function enableCssStylesForExecCommand() {
  document.execCommand("styleWithCSS", false, "true");
}

/** 굵게·기울임·취소선 — 토글(해제 포함) */
export function runFormatCommand(command: "bold" | "italic" | "strikeThrough" | "underline") {
  enableCssStylesForExecCommand();
  document.execCommand(command, false);
}

/** 글자 색상 */
export function runForeColor(color: string) {
  enableCssStylesForExecCommand();
  document.execCommand("foreColor", false, color);
}

/** 에디터 서식 실행 — 선택 복원 후 명령 */
export function applyEditorFormat(
  editor: HTMLElement,
  saved: SavedSelectionRef,
  apply: (range: Range) => void,
): boolean {
  const range = prepareEditorSelection(editor, saved);
  if (!range) return false;
  apply(range);
  return true;
}
