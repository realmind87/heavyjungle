"use client";

import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import { parseStorageObjectKeyFromPublicUrl } from "@/lib/public-object-url";

const EDITOR_IMAGE_SELECTED_CLASS = "editor-image-selected";
type SelectableMediaElement = HTMLImageElement | HTMLVideoElement;

export function prepareEditorMedia(element: SelectableMediaElement) {
  if (element.dataset.editorImagePrepared === "true") return;
  element.contentEditable = "false";
  element.draggable = false;
  element.dataset.editorImagePrepared = "true";
}

export function prepareEditorImage(img: HTMLImageElement) {
  prepareEditorMedia(img);
}

export function prepareAllEditorImages(editor: HTMLElement) {
  editor.querySelectorAll("img,video").forEach((node) => {
    if (node instanceof HTMLImageElement || node instanceof HTMLVideoElement) {
      prepareEditorMedia(node);
    }
  });
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
  const [deleteButtonPosition, setDeleteButtonPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  const updateDeleteButtonPosition = useCallback(() => {
    const editor = editorRef.current;
    const img = selectedImageRef.current;
    if (!editor || !img || !editor.contains(img)) {
      setDeleteButtonPosition(null);
      return;
    }

    setDeleteButtonPosition({
      top: img.offsetTop + 6,
      left: img.offsetLeft + img.offsetWidth - 30,
    });
  }, [editorRef]);

  const clearSelection = useCallback(() => {
    if (selectedImageRef.current) {
      selectedImageRef.current.classList.remove(EDITOR_IMAGE_SELECTED_CLASS);
    }
    selectedImageRef.current = null;
    setSelectedImage(null);
    setDeleteButtonPosition(null);
  }, []);

  const selectImage = useCallback(
    (img: SelectableMediaElement) => {
      if (selectedImageRef.current === img) return;
      clearSelection();
      prepareEditorMedia(img);
      img.classList.add(EDITOR_IMAGE_SELECTED_CLASS);
      selectedImageRef.current = img;
      setSelectedImage(img);
      setDeleteButtonPosition({
        top: img.offsetTop + 6,
        left: img.offsetLeft + img.offsetWidth - 30,
      });
    },
    [clearSelection],
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

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    prepareAllEditorImages(editor);

    const observer = new MutationObserver(() => {
      prepareAllEditorImages(editor);
      updateDeleteButtonPosition();
    });
    observer.observe(editor, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [editorRef, updateDeleteButtonPosition]);

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
    root.addEventListener("scroll", updateDeleteButtonPosition);
    window.addEventListener("resize", updateDeleteButtonPosition);
    return () => {
      root.removeEventListener("click", handleClick);
      root.removeEventListener("keydown", handleKeyDown);
      root.removeEventListener("scroll", updateDeleteButtonPosition);
      window.removeEventListener("resize", updateDeleteButtonPosition);
    };
  }, [editorRef, clearSelection, removeSelectedImage, selectImage, updateDeleteButtonPosition]);

  useEffect(() => {
    if (!selectedImage) return;

    let frameId = 0;
    const tick = () => {
      updateDeleteButtonPosition();
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [selectedImage, updateDeleteButtonPosition]);

  return {
    selectedImage,
    removeSelectedImage,
    deleteButtonPosition,
  };
}
