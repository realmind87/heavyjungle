"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "@/components/ui/toast";
import { parseStorageObjectKeyFromPublicUrl } from "@/lib/public-object-url";

const EDITOR_IMAGE_SELECTED_CLASS = "editor-image-selected";
const EDITOR_IMAGE_DRAGGING_CLASS = "editor-image-dragging";
const MIN_IMAGE_WIDTH_PX = 48;

type SelectableMediaElement = HTMLImageElement | HTMLVideoElement;
type OverlayPoint = { top: number; left: number };

export function prepareEditorMedia(element: SelectableMediaElement) {
  element.contentEditable = "false";
  // 이미지는 드래그로 본문 위치를 옮길 수 있게 함
  element.draggable = element instanceof HTMLImageElement;
  element.dataset.editorImagePrepared = "true";
}

export function prepareEditorImage(img: HTMLImageElement) {
  prepareEditorMedia(img);
}

/** 블록 미디어 삽입 후 아래 빈 줄에 커서 — 일반 WYSIWYG 패턴 */
export function insertEditorBlockWithCaretLine(
  editor: HTMLElement,
  range: Range | null,
  node: HTMLElement,
  restoreSelection: (range: Range) => void,
) {
  if (range) {
    range.insertNode(node);
  } else {
    editor.appendChild(node);
  }

  const line = document.createElement("div");
  line.appendChild(document.createElement("br"));
  node.after(line);

  const caret = document.createRange();
  caret.selectNodeContents(line);
  caret.collapse(true);
  restoreSelection(caret);
}

export function prepareAllEditorImages(editor: HTMLElement) {
  editor.querySelectorAll("img,video").forEach((node) => {
    if (node instanceof HTMLImageElement) {
      prepareEditorImage(node);
    } else if (node instanceof HTMLVideoElement) {
      prepareEditorMedia(node);
    }
  });
}

function getMaxImageWidth(editor: HTMLElement, img: HTMLImageElement): number {
  return Math.max(MIN_IMAGE_WIDTH_PX, editor.clientWidth || img.getBoundingClientRect().width);
}

function applyImageWidth(img: HTMLImageElement, widthPx: number, maxWidth: number) {
  const width = Math.max(MIN_IMAGE_WIDTH_PX, Math.min(maxWidth, Math.round(widthPx)));
  img.style.width = `${width}px`;
  img.style.height = "auto";
  img.style.maxWidth = "100%";
  if (!img.style.display) {
    img.style.display = "block";
  }
}

function isEmptyCaretLine(el: HTMLElement): boolean {
  if (el.querySelector("img,video,iframe,table")) return false;
  const text = (el.textContent ?? "").replace(/\u00a0/g, "").trim();
  return text === "";
}

function getTrailingEmptyCaretLine(img: HTMLImageElement): HTMLElement | null {
  const next = img.nextElementSibling;
  if (!(next instanceof HTMLElement)) return null;
  return isEmptyCaretLine(next) ? next : null;
}

function ensureCaretLineAfter(img: HTMLImageElement) {
  const next = img.nextElementSibling;
  if (next instanceof HTMLElement && isEmptyCaretLine(next)) return;
  const line = document.createElement("div");
  line.appendChild(document.createElement("br"));
  img.after(line);
}

function findBlockInEditor(node: Node, editor: HTMLElement): HTMLElement {
  let current: Node | null = node;
  while (current && current !== editor) {
    if (current instanceof HTMLElement) {
      const { display } = window.getComputedStyle(current);
      if (
        display === "block" ||
        display === "flex" ||
        display === "grid" ||
        display === "list-item" ||
        current.tagName === "DIV" ||
        current.tagName === "P" ||
        current.tagName === "LI" ||
        current.tagName === "BLOCKQUOTE"
      ) {
        return current;
      }
    }
    current = current.parentNode;
  }
  return editor;
}

function caretRangeFromPoint(clientX: number, clientY: number): Range | null {
  if (typeof document.caretRangeFromPoint === "function") {
    return document.caretRangeFromPoint(clientX, clientY);
  }

  const caretPosition = (
    document as Document & {
      caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    }
  ).caretPositionFromPoint?.(clientX, clientY);

  if (!caretPosition) return null;
  const range = document.createRange();
  range.setStart(caretPosition.offsetNode, caretPosition.offset);
  range.collapse(true);
  return range;
}

/** 드래그한 이미지를 드롭 좌표 기준 본문 위치로 이동 */
type ImageDropPlacement = {
  anchor: HTMLElement;
  placeAfter: boolean;
};

function isDropIndicator(el: Element): boolean {
  return el instanceof HTMLElement && el.dataset.editorImageDropIndicator === "true";
}

function resolveImageDropPlacement(
  editor: HTMLElement,
  img: HTMLImageElement,
  clientX: number,
  clientY: number,
): ImageDropPlacement | null {
  const trailing = getTrailingEmptyCaretLine(img);

  const dropEl =
    document.elementsFromPoint(clientX, clientY).find((el) => {
      if (el === img || img.contains(el) || isDropIndicator(el)) return false;
      if (trailing && (el === trailing || trailing.contains(el))) return false;
      return editor === el || editor.contains(el);
    }) ?? null;
  if (!(dropEl instanceof Element)) return null;

  const mediaTarget = dropEl.closest("img,video,iframe");
  if (
    mediaTarget instanceof HTMLElement &&
    mediaTarget !== img &&
    editor.contains(mediaTarget)
  ) {
    const rect = mediaTarget.getBoundingClientRect();
    return {
      anchor: mediaTarget,
      placeAfter: clientY > rect.top + rect.height / 2,
    };
  }

  const range = caretRangeFromPoint(clientX, clientY);
  if (!range || !editor.contains(range.commonAncestorContainer)) return null;
  if (img.contains(range.commonAncestorContainer)) return null;

  const block = findBlockInEditor(range.commonAncestorContainer, editor);
  if (
    block === editor ||
    block === img ||
    img.contains(block) ||
    isDropIndicator(block) ||
    (trailing != null && (block === trailing || trailing.contains(block)))
  ) {
    const siblings = Array.from(editor.children).filter((child) => {
      if (!(child instanceof HTMLElement)) return false;
      if (child === img || isDropIndicator(child)) return false;
      if (trailing && child === trailing) return false;
      return true;
    }) as HTMLElement[];

    if (siblings.length === 0) {
      return { anchor: editor, placeAfter: true };
    }

    const editorRect = editor.getBoundingClientRect();
    if (clientY <= editorRect.top + 12) {
      return { anchor: siblings[0], placeAfter: false };
    }
    if (clientY >= editorRect.bottom - 12) {
      return { anchor: siblings[siblings.length - 1], placeAfter: true };
    }

    let nearest = siblings[0];
    let nearestDist = Number.POSITIVE_INFINITY;
    for (const sibling of siblings) {
      const rect = sibling.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const dist = Math.abs(clientY - mid);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = sibling;
      }
    }
    const rect = nearest.getBoundingClientRect();
    return {
      anchor: nearest,
      placeAfter: clientY > rect.top + rect.height / 2,
    };
  }

  const rect = block.getBoundingClientRect();
  return {
    anchor: block,
    placeAfter: clientY > rect.top + rect.height / 2,
  };
}

function placementsEqual(a: ImageDropPlacement | null, b: ImageDropPlacement | null): boolean {
  if (!a || !b) return a === b;
  return a.anchor === b.anchor && a.placeAfter === b.placeAfter;
}

function createDropIndicator(): HTMLDivElement {
  const el = document.createElement("div");
  el.dataset.editorImageDropIndicator = "true";
  el.className = "editor-image-drop-indicator";
  el.contentEditable = "false";
  el.setAttribute("aria-hidden", "true");
  return el;
}

function showDropIndicator(editor: HTMLElement, placement: ImageDropPlacement, indicator: HTMLDivElement) {
  if (placement.anchor === editor) {
    editor.appendChild(indicator);
    return;
  }
  if (placement.placeAfter) {
    placement.anchor.after(indicator);
  } else {
    placement.anchor.before(indicator);
  }
}

function applyImageDropPlacement(
  editor: HTMLElement,
  img: HTMLImageElement,
  placement: ImageDropPlacement,
): boolean {
  if (placement.anchor === img || img.contains(placement.anchor)) return false;

  const trailing = getTrailingEmptyCaretLine(img);
  if (trailing && (placement.anchor === trailing || trailing.contains(placement.anchor))) {
    return false;
  }

  const { anchor, placeAfter } = placement;
  img.remove();
  trailing?.remove();

  if (anchor === editor) {
    editor.appendChild(img);
    ensureCaretLineAfter(img);
    return true;
  }

  if (!anchor.isConnected || !editor.contains(anchor)) {
    editor.appendChild(img);
    ensureCaretLineAfter(img);
    return true;
  }

  if (placeAfter) {
    anchor.after(img);
  } else {
    anchor.before(img);
  }
  ensureCaretLineAfter(img);
  return true;
}

type StoragePrefix = "posts" | "comments";

type UseRichTextImageControlsOptions = {
  editorRef: RefObject<HTMLDivElement | null>;
  storagePrefix: StoragePrefix;
  onInput: () => void;
  deleteImage: (key: string) => Promise<{ error?: string } | { success: true }>;
};

export function useRichTextImageControls({
  editorRef,
  storagePrefix,
  onInput,
  deleteImage,
}: UseRichTextImageControlsOptions) {
  const selectedImageRef = useRef<SelectableMediaElement | null>(null);
  const draggingImageRef = useRef<HTMLImageElement | null>(null);
  const dropPlacementRef = useRef<ImageDropPlacement | null>(null);
  const dropIndicatorRef = useRef<HTMLDivElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<SelectableMediaElement | null>(null);
  const [deleteButtonPosition, setDeleteButtonPosition] = useState<OverlayPoint | null>(null);
  const [resizeHandlePosition, setResizeHandlePosition] = useState<OverlayPoint | null>(null);

  const updateOverlayPositions = useCallback(() => {
    const editor = editorRef.current;
    const media = selectedImageRef.current;
    if (!editor || !media || !editor.contains(media)) {
      setDeleteButtonPosition(null);
      setResizeHandlePosition(null);
      return;
    }

    const scrollHost =
      (editor.closest("[data-editor-scroll-host]") as HTMLElement | null) ??
      (editor.parentElement instanceof HTMLElement ? editor.parentElement : editor);
    const overlayRoot =
      (editor.closest("[data-editor-overlay-root]") as HTMLElement | null) ??
      (scrollHost.parentElement instanceof HTMLElement ? scrollHost.parentElement : scrollHost);

    const scrollRect = scrollHost.getBoundingClientRect();
    const rootRect = overlayRoot.getBoundingClientRect();
    const mediaRect = media.getBoundingClientRect();

    // 클래식/오버레이 스크롤바 모두 피하도록 여유 확보
    const scrollbarGutter = Math.max(22, scrollHost.offsetWidth - scrollHost.clientWidth + 8);
    const deleteSize = 28;
    const resizeSize = 20;
    const pad = 8;

    // 스크롤 호스트 ∩ 브라우저 뷰포트 — 긴 이미지도 핸들이 화면 밖으로 안 나가게
    const clipTop = Math.max(mediaRect.top, scrollRect.top, 0);
    const clipLeft = Math.max(mediaRect.left, scrollRect.left);
    const clipBottom = Math.min(mediaRect.bottom, scrollRect.bottom, window.innerHeight);
    const clipRight = Math.min(mediaRect.right, scrollRect.right - scrollbarGutter);

    if (clipBottom - clipTop < 8 || clipRight - clipLeft < 8) {
      setDeleteButtonPosition(null);
      setResizeHandlePosition(null);
      return;
    }

    // 스크롤 컨테이너 밖(overlay root)에 그려 스크롤바와 겹치지 않게 함
    setDeleteButtonPosition({
      top: clipTop + pad - rootRect.top,
      left: Math.max(clipLeft + pad, clipRight - deleteSize - pad) - rootRect.left,
    });

    if (media instanceof HTMLImageElement) {
      setResizeHandlePosition({
        top: Math.max(clipTop + pad, clipBottom - resizeSize - pad) - rootRect.top,
        left: Math.max(clipLeft + pad, clipRight - resizeSize - pad) - rootRect.left,
      });
    } else {
      setResizeHandlePosition(null);
    }
  }, [editorRef]);

  const clearSelection = useCallback(() => {
    if (selectedImageRef.current) {
      selectedImageRef.current.classList.remove(EDITOR_IMAGE_SELECTED_CLASS);
    }
    selectedImageRef.current = null;
    setSelectedImage(null);
    setDeleteButtonPosition(null);
    setResizeHandlePosition(null);
  }, []);

  const selectImage = useCallback(
    (img: SelectableMediaElement) => {
      if (selectedImageRef.current === img) {
        updateOverlayPositions();
        return;
      }
      clearSelection();
      prepareEditorMedia(img);
      img.classList.add(EDITOR_IMAGE_SELECTED_CLASS);
      selectedImageRef.current = img;
      setSelectedImage(img);
      // 핸들이 보이도록 선택 이미지를 스크롤 영역 안으로 맞춤
      img.scrollIntoView({ block: "nearest", inline: "nearest" });
      updateOverlayPositions();
    },
    [clearSelection, updateOverlayPositions],
  );

  const removeSelectedImage = useCallback(async () => {
    const img = selectedImageRef.current;
    if (!img) return;

    const key = parseStorageObjectKeyFromPublicUrl(img.currentSrc || img.src, storagePrefix);
    img.remove();
    clearSelection();
    onInput();

    if (!key) return;

    const result = await deleteImage(key);
    if ("error" in result && result.error) {
      toast.error(result.error);
    }
  }, [clearSelection, deleteImage, onInput, storagePrefix]);

  const startImageResize = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const img = selectedImageRef.current;
      const editor = editorRef.current;
      if (!(img instanceof HTMLImageElement) || !editor) return;

      event.preventDefault();
      event.stopPropagation();

      const handle = event.currentTarget;
      handle.setPointerCapture(event.pointerId);

      const startX = event.clientX;
      const startWidth = img.getBoundingClientRect().width;
      const maxWidth = getMaxImageWidth(editor, img);
      const host =
        (editor.closest("[data-editor-scroll-host]") as HTMLElement | null) ??
        (editor.parentElement instanceof HTMLElement ? editor.parentElement : editor);

      const onPointerMove = (moveEvent: PointerEvent) => {
        const nextWidth = startWidth + (moveEvent.clientX - startX);
        applyImageWidth(img, nextWidth, maxWidth);
        updateOverlayPositions();

        // 줄이는 중에도 핸들이 뷰 안에 남도록 스크롤 보정
        const mediaRect = img.getBoundingClientRect();
        const hostRect = host.getBoundingClientRect();
        if (mediaRect.bottom < hostRect.top + 40) {
          host.scrollTop = Math.max(0, host.scrollTop - (hostRect.top + 40 - mediaRect.bottom));
        } else if (mediaRect.top > hostRect.bottom - 40) {
          host.scrollTop += mediaRect.top - (hostRect.bottom - 40);
        }
      };

      const onPointerUp = (upEvent: PointerEvent) => {
        if (handle.hasPointerCapture(upEvent.pointerId)) {
          handle.releasePointerCapture(upEvent.pointerId);
        }
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        onInput();
        updateOverlayPositions();
      };

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    },
    [editorRef, onInput, updateOverlayPositions],
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    prepareAllEditorImages(editor);

    const observer = new MutationObserver(() => {
      prepareAllEditorImages(editor);
      updateOverlayPositions();
    });
    observer.observe(editor, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [editorRef, updateOverlayPositions]);

  useEffect(() => {
    if (!editorRef.current) return;
    const root = editorRef.current;

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (
        (target instanceof HTMLImageElement || target instanceof HTMLVideoElement) &&
        root.contains(target)
      ) {
        event.preventDefault();
        selectImage(target);
        return;
      }
      clearSelection();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedImageRef.current || !root.contains(selectedImageRef.current)) return;
      if (event.key !== "Backspace" && event.key !== "Delete") return;
      event.preventDefault();
      void removeSelectedImage();
    };

    const removeDropIndicator = () => {
      dropIndicatorRef.current?.remove();
      dropIndicatorRef.current = null;
      dropPlacementRef.current = null;
    };

    const clearDraggingState = () => {
      const dragging = draggingImageRef.current;
      if (dragging) {
        dragging.classList.remove(EDITOR_IMAGE_DRAGGING_CLASS);
      }
      draggingImageRef.current = null;
      removeDropIndicator();
    };

    const handleDragStart = (event: DragEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement) || !root.contains(target)) return;
      if (!event.dataTransfer) return;

      draggingImageRef.current = target;
      selectImage(target);
      target.classList.add(EDITOR_IMAGE_DRAGGING_CLASS);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("application/x-editor-image", "1");
      event.dataTransfer.setData("text/plain", "image");
    };

    const handleDragOver = (event: DragEvent) => {
      const img = draggingImageRef.current;
      if (!img) return;
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }

      const placement = resolveImageDropPlacement(root, img, event.clientX, event.clientY);
      if (!placement) {
        removeDropIndicator();
        return;
      }
      if (placementsEqual(dropPlacementRef.current, placement)) return;

      dropPlacementRef.current = placement;
      const indicator = dropIndicatorRef.current ?? createDropIndicator();
      dropIndicatorRef.current = indicator;
      showDropIndicator(root, placement, indicator);
    };

    const handleDrop = (event: DragEvent) => {
      const img = draggingImageRef.current;
      if (!img || !root.contains(img)) {
        clearDraggingState();
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const placement =
        dropPlacementRef.current ?? resolveImageDropPlacement(root, img, event.clientX, event.clientY);

      removeDropIndicator();
      const moved = placement ? applyImageDropPlacement(root, img, placement) : false;
      clearDraggingState();

      if (!moved) return;

      selectImage(img);
      onInput();
      updateOverlayPositions();
    };

    const handleDragEnd = () => {
      clearDraggingState();
      updateOverlayPositions();
    };

    const overlayHost =
      (root.closest("[data-editor-scroll-host]") as HTMLElement | null) ??
      (root.parentElement instanceof HTMLElement ? root.parentElement : root);

    root.addEventListener("click", handleClick);
    root.addEventListener("keydown", handleKeyDown);
    root.addEventListener("dragstart", handleDragStart);
    root.addEventListener("dragover", handleDragOver);
    root.addEventListener("drop", handleDrop);
    root.addEventListener("dragend", handleDragEnd);
    overlayHost.addEventListener("scroll", updateOverlayPositions, { passive: true });
    window.addEventListener("resize", updateOverlayPositions);
    return () => {
      root.removeEventListener("click", handleClick);
      root.removeEventListener("keydown", handleKeyDown);
      root.removeEventListener("dragstart", handleDragStart);
      root.removeEventListener("dragover", handleDragOver);
      root.removeEventListener("drop", handleDrop);
      root.removeEventListener("dragend", handleDragEnd);
      overlayHost.removeEventListener("scroll", updateOverlayPositions);
      window.removeEventListener("resize", updateOverlayPositions);
    };
  }, [editorRef, clearSelection, onInput, removeSelectedImage, selectImage, updateOverlayPositions]);

  useEffect(() => {
    if (!selectedImage) return;

    let frameId = 0;
    const tick = () => {
      updateOverlayPositions();
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [selectedImage, updateOverlayPositions]);

  return {
    selectedImage,
    removeSelectedImage,
    deleteButtonPosition,
    resizeHandlePosition,
    startImageResize,
  };
}
