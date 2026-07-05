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
const MIN_IMAGE_WIDTH_PX = 48;

type SelectableMediaElement = HTMLImageElement | HTMLVideoElement;
type OverlayPoint = { top: number; left: number };

export function prepareEditorMedia(element: SelectableMediaElement) {
  if (element.dataset.editorImagePrepared === "true") return;
  element.contentEditable = "false";
  element.draggable = false;
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

    setDeleteButtonPosition({
      top: media.offsetTop + 6,
      left: media.offsetLeft + media.offsetWidth - 30,
    });

    if (media instanceof HTMLImageElement) {
      setResizeHandlePosition({
        top: media.offsetTop + media.offsetHeight - 10,
        left: media.offsetLeft + media.offsetWidth - 10,
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
      if (selectedImageRef.current === img) return;
      clearSelection();
      prepareEditorMedia(img);
      img.classList.add(EDITOR_IMAGE_SELECTED_CLASS);
      selectedImageRef.current = img;
      setSelectedImage(img);
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

      const startX = event.clientX;
      const startWidth = img.getBoundingClientRect().width;
      const maxWidth = getMaxImageWidth(editor, img);

      const onPointerMove = (moveEvent: PointerEvent) => {
        const nextWidth = startWidth + (moveEvent.clientX - startX);
        applyImageWidth(img, nextWidth, maxWidth);
        updateOverlayPositions();
      };

      const onPointerUp = () => {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        onInput();
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

    root.addEventListener("click", handleClick);
    root.addEventListener("keydown", handleKeyDown);
    root.addEventListener("scroll", updateOverlayPositions);
    window.addEventListener("resize", updateOverlayPositions);
    return () => {
      root.removeEventListener("click", handleClick);
      root.removeEventListener("keydown", handleKeyDown);
      root.removeEventListener("scroll", updateOverlayPositions);
      window.removeEventListener("resize", updateOverlayPositions);
    };
  }, [editorRef, clearSelection, removeSelectedImage, selectImage, updateOverlayPositions]);

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
