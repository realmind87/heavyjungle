"use client";

import { type ReactNode, type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import {
  createPostImageUploadUrl,
  createPostVideoUploadUrl,
  deletePostImage,
} from "@/features/uploads/actions";
import {
  POST_IMAGE_ALLOWED_CONTENT_TYPES,
  POST_IMAGE_MAX_BYTES,
  POST_VIDEO_ALLOWED_CONTENT_TYPES,
  POST_VIDEO_MAX_BYTES,
  resolvePostImageContentType,
} from "@/features/uploads/constants";
import { postContentEditorExtraClass, postContentProseClass } from "@/lib/post-content-styles";
import { prepareEditorImage, prepareEditorMedia, insertEditorBlockWithCaretLine, useRichTextImageControls } from "@/lib/rich-text-editor-image";
import { EditorImageOverlay } from "@/lib/rich-text-editor-image-overlay";
import { postContentImageClass } from "@/lib/post-content-styles";
import { handleRichTextEditorKeyDown } from "@/lib/rich-text-editor-shortcuts";
import {
  applyEditorFormat,
  applyFontSizePx,
  prepareEditorSelection,
  runFormatCommand,
  runForeColor,
  saveEditorSelection,
  wrapRangeWithElement,
  getSelectionRange,
  restoreSelection,
} from "@/lib/rich-text-editor-format";

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
  errorMessage?: string | null;
  onInput: () => void;
  /** 툴바와 함께 sticky 하단에 고정할 영역 (작성/등록 버튼 등) */
  footer?: ReactNode;
};

type VideoPosterSelectorState = {
  file: File;
  videoElement: HTMLVideoElement;
  previewUrl: string;
  duration: number;
  selectedTime: number;
  frames: Array<{ time: number; previewUrl: string }>;
  generatingFrames: boolean;
};

const VIDEO_COVER_MIN_FRAMES = 20;
const VIDEO_COVER_MAX_FRAMES = 30;

function preventToolbarBlur(event: React.MouseEvent) {
  event.preventDefault();
}

function normalizeLinkUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
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
  if (!range || !editor.contains(range.commonAncestorContainer)) {
    let fallbackBlock: HTMLElement | null =
      editor.lastElementChild instanceof HTMLElement ? editor.lastElementChild : null;
    if (!(fallbackBlock instanceof HTMLElement)) {
      fallbackBlock = document.createElement("div");
      if (editor.childNodes.length === 0) {
        fallbackBlock.appendChild(document.createElement("br"));
      } else {
        while (editor.firstChild) {
          fallbackBlock.appendChild(editor.firstChild);
        }
      }
      editor.appendChild(fallbackBlock);
    }
    fallbackBlock.style.setProperty("text-align", align);
    return;
  }

  let block = findBlockInEditor(range.commonAncestorContainer, editor);
  if (block === editor) {
    const wrapper = document.createElement("div");
    if (editor.childNodes.length === 0) {
      wrapper.appendChild(document.createElement("br"));
    } else {
      while (editor.firstChild) {
        wrapper.appendChild(editor.firstChild);
      }
    }
    editor.appendChild(wrapper);
    block = wrapper;
  }

  block.style.setProperty("text-align", align);
}

function applyAlignToMedia(
  editor: HTMLElement,
  media: HTMLImageElement | HTMLVideoElement,
  align: "left" | "center" | "right",
) {
  const parent = media.parentElement;
  let wrapper: HTMLElement;

  if (
    parent &&
    parent !== editor &&
    (parent.tagName === "DIV" || parent.tagName === "P") &&
    parent.childNodes.length === 1 &&
    parent.firstChild === media
  ) {
    wrapper = parent;
  } else {
    wrapper = document.createElement("div");
    media.replaceWith(wrapper);
    wrapper.appendChild(media);
  }

  wrapper.style.setProperty("text-align", align);

  media.style.display = "block";
  if (align === "left") {
    media.style.marginLeft = "0";
    media.style.marginRight = "auto";
  } else if (align === "center") {
    media.style.marginLeft = "auto";
    media.style.marginRight = "auto";
  } else {
    media.style.marginLeft = "auto";
    media.style.marginRight = "0";
  }
}

function normalizeYoutubeEmbedUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\/+/, "").split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "www.youtube.com" || host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      if (url.pathname.startsWith("/shorts/")) {
        const id = url.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function createVideoFrameBlob(file: File, timeInSeconds: number): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.src = objectUrl;
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("영상 메타데이터를 불러오지 못했습니다."));
    });

    await new Promise<void>((resolve, reject) => {
      video.currentTime = Math.max(0, Math.min(timeInSeconds, (video.duration || 0) - 0.05));
      video.onseeked = () => resolve();
      video.onerror = () => reject(new Error("영상 프레임 추출에 실패했습니다."));
    });

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("썸네일 캔버스를 생성할 수 없습니다.");

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((value) => resolve(value), "image/jpeg", 0.9);
    });

    if (!blob) throw new Error("썸네일 이미지 생성에 실패했습니다.");
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function createVideoFramePreviews(
  file: File,
  frameCount?: number,
): Promise<{ frames: Array<{ time: number; previewUrl: string }>; duration: number }> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.src = objectUrl;
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("영상 메타데이터를 불러오지 못했습니다."));
    });

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const safeDuration = Math.max(duration, 0.1);
    const computedFrameCount = Math.min(
      VIDEO_COVER_MAX_FRAMES,
      Math.max(VIDEO_COVER_MIN_FRAMES, Math.floor(safeDuration / 2)),
    );
    const targetFrameCount = frameCount ?? computedFrameCount;
    const frames: Array<{ time: number; previewUrl: string }> = [];

    for (let i = 0; i < targetFrameCount; i += 1) {
      const ratio = targetFrameCount === 1 ? 0 : i / (targetFrameCount - 1);
      const time = Math.max(0, Math.min(safeDuration - 0.05, safeDuration * ratio));

      await new Promise<void>((resolve, reject) => {
        video.currentTime = time;
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error("프레임 추출 중 오류가 발생했습니다."));
      });

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      frames.push({
        time,
        previewUrl: canvas.toDataURL("image/jpeg", 0.75),
      });
    }

    return { frames, duration: safeDuration };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

type ToolbarButtonProps = {
  label: string;
  onClick: () => void;
  onPointerDown?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
};

function ToolbarButton({ label, onClick, onPointerDown, disabled, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => {
        preventToolbarBlur(event);
        onPointerDown?.();
      }}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
        onMouseDown={(event) => {
          preventToolbarBlur(event);
          onBeforeOpen();
        }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-8 min-w-[4.5rem] items-center justify-between gap-1 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <span>{activeLabel}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition dark:text-zinc-400 ${isOpen ? "rotate-180" : ""}`}
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
                onMouseDown={(event) => {
                  preventToolbarBlur(event);
                  onBeforeOpen();
                }}
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
  errorMessage = null,
  onInput,
  footer,
}: PostRichTextEditorProps) {
  const savedRangeRef = useRef<Range | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [savingPoster, setSavingPoster] = useState(false);
  const [posterSelector, setPosterSelector] = useState<VideoPosterSelectorState | null>(null);
  const [isDraggingPoster, setIsDraggingPoster] = useState(false);
  const posterStripRef = useRef<HTMLDivElement>(null);
  const isDraggingPosterRef = useRef(false);
  const videoUploadXhrRef = useRef<XMLHttpRequest | null>(null);
  const videoUploadCancelledRef = useRef(false);
  const [uploadProgress, setUploadProgress] = useState<{
    label: "이미지" | "동영상";
    percent: number;
    startedAt: number;
  } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const { selectedImage, removeSelectedImage, deleteButtonPosition, resizeHandlePosition, startImageResize } =
    useRichTextImageControls({
    editorRef,
    storagePrefix: "posts",
    onInput,
    deleteImage: deletePostImage,
  });

  const focusEditor = useCallback(() => {
    editorRef.current?.focus();
  }, [editorRef]);

  useEffect(() => {
    if (!uploadProgress) {
      setElapsedSeconds(0);
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - uploadProgress.startedAt) / 1000));
    }, 250);

    return () => window.clearInterval(timer);
  }, [uploadProgress]);

  const applyFontSize = useCallback(
    (size: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      const applied = applyEditorFormat(editor, savedRangeRef, (range) => {
        applyFontSizePx(editor, size, range);
      });
      if (applied) onInput();
    },
    [editorRef, onInput],
  );

  const handleFontSizePointerDown = useCallback(() => {
    saveEditorSelection(editorRef.current, savedRangeRef);
  }, [editorRef]);

  const saveSelection = useCallback(() => {
    saveEditorSelection(editorRef.current, savedRangeRef);
  }, [editorRef]);

  const applyColor = useCallback(
    (color: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      const applied = applyEditorFormat(editor, savedRangeRef, () => {
        runForeColor(color);
      });
      if (applied) onInput();
    },
    [editorRef, onInput],
  );

  const insertLink = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    saveEditorSelection(editor, savedRangeRef);
    const urlInput = window.prompt("링크 URL을 입력하세요 (https://...)");
    const url = urlInput ? normalizeLinkUrl(urlInput) : null;
    if (!url) {
      if (urlInput?.trim()) {
        toast.error("http:// 또는 https:// 로 시작하는 URL만 사용할 수 있습니다.");
      }
      return;
    }

    focusEditor();
    prepareEditorSelection(editor, savedRangeRef);
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

  const applyBold = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const applied = applyEditorFormat(editor, savedRangeRef, () => {
      runFormatCommand("bold");
    });
    if (applied) onInput();
  }, [editorRef, onInput]);

  const applyItalic = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const applied = applyEditorFormat(editor, savedRangeRef, () => {
      runFormatCommand("italic");
    });
    if (applied) onInput();
  }, [editorRef, onInput]);

  const applyStrikethrough = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const applied = applyEditorFormat(editor, savedRangeRef, () => {
      runFormatCommand("strikeThrough");
    });
    if (applied) onInput();
  }, [editorRef, onInput]);

  const handleEditorKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const editor = editorRef.current;
      if (!editor) return;

      handleRichTextEditorKeyDown(event, editor, {
        onBold: applyBold,
        onItalic: applyItalic,
        onStrikethrough: applyStrikethrough,
        onLink: insertLink,
        onInput,
      });
    },
    [applyBold, applyItalic, applyStrikethrough, editorRef, insertLink, onInput],
  );

  const applyAlign = useCallback(
    (align: "left" | "center" | "right") => {
      const editor = editorRef.current;
      if (!editor) return;
      if (
        selectedImage &&
        editor.contains(selectedImage) &&
        (selectedImage instanceof HTMLImageElement || selectedImage instanceof HTMLVideoElement)
      ) {
        applyAlignToMedia(editor, selectedImage, align);
        onInput();
        return;
      }
      focusEditor();
      prepareEditorSelection(editor, savedRangeRef);
      applyTextAlign(editor, align);
      onInput();
    },
    [editorRef, focusEditor, onInput, selectedImage],
  );

  const insertImageAtCursor = useCallback(
    (publicUrl: string, alt: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      focusEditor();
      prepareEditorSelection(editor, savedRangeRef);
      const range = getSelectionRange();

      const image = document.createElement("img");
      image.src = publicUrl;
      image.alt = alt;
      image.className = postContentImageClass;
      prepareEditorImage(image);

      insertEditorBlockWithCaretLine(editor, range, image, restoreSelection);

      onInput();
    },
    [editorRef, focusEditor, onInput],
  );

  const insertVideoAtCursor = useCallback(
    (publicUrl: string) => {
      const editor = editorRef.current;
      if (!editor) return null;

      focusEditor();
      prepareEditorSelection(editor, savedRangeRef);
      const range = getSelectionRange();

      const video = document.createElement("video");
      video.src = publicUrl;
      video.controls = true;
      video.preload = "metadata";
      video.className = "my-3 block max-w-full max-h-[32rem] rounded-lg";
      prepareEditorMedia(video);

      insertEditorBlockWithCaretLine(editor, range, video, restoreSelection);

      onInput();
      return video;
    },
    [editorRef, focusEditor, onInput],
  );

  const insertYoutubeAtCursor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const urlInput = window.prompt("유튜브 링크를 입력하세요");
    const embedUrl = urlInput ? normalizeYoutubeEmbedUrl(urlInput) : null;
    if (!embedUrl) {
      if (urlInput?.trim()) {
        toast.error("유효한 유튜브 링크를 입력해 주세요.");
      }
      return;
    }

    focusEditor();
    prepareEditorSelection(editor, savedRangeRef);
    const range = getSelectionRange();

    const iframe = document.createElement("iframe");
    iframe.src = embedUrl;
    iframe.title = "YouTube video player";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.className = "my-3 block aspect-video w-full max-w-full rounded-lg";

    insertEditorBlockWithCaretLine(editor, range, iframe, restoreSelection);

    onInput();
  }, [editorRef, focusEditor, onInput]);

  const handleImageFile = useCallback(
    async (file: File) => {
      const contentType = resolvePostImageContentType(file);
      if (!contentType) {
        toast.error("JPEG, PNG, WebP, GIF 이미지만 업로드할 수 있습니다.");
        return;
      }

      if (file.size > POST_IMAGE_MAX_BYTES) {
        toast.error("파일 크기는 100MB 이하여야 합니다.");
        return;
      }

      setUploadingImage(true);
      setUploadProgress({ label: "이미지", percent: 0, startedAt: Date.now() });

      const intent = await createPostImageUploadUrl({
        filename: file.name,
        contentType,
        size: file.size,
      });

      if ("error" in intent) {
        toast.error(intent.error);
        setUploadingImage(false);
        setUploadProgress(null);
        return;
      }

      const putResponse = await new Promise<boolean>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", intent.uploadUrl);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
          setUploadProgress((prev) =>
            prev && prev.label === "이미지" ? { ...prev, percent } : prev,
          );
        };
        xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
        xhr.onerror = () => resolve(false);
        xhr.send(file);
      });

      if (!putResponse) {
        toast.error("이미지 업로드에 실패했습니다.");
        setUploadingImage(false);
        setUploadProgress(null);
        return;
      }

      insertImageAtCursor(intent.publicUrl, file.name);
      setUploadingImage(false);
      setUploadProgress(null);
    },
    [insertImageAtCursor],
  );

  const handleVideoFile = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const contentType =
        file.type ||
        (ext === "mov"
          ? "video/quicktime"
          : ext === "mp4"
            ? "video/mp4"
            : ext === "webm"
              ? "video/webm"
              : "");

      if (!(POST_VIDEO_ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType)) {
        toast.error("MP4, WebM, MOV 영상만 업로드할 수 있습니다.");
        return;
      }

      if (file.size > POST_VIDEO_MAX_BYTES) {
        toast.error("영상 파일 크기는 1GB 이하여야 합니다.");
        return;
      }

      videoUploadCancelledRef.current = false;
      videoUploadXhrRef.current = null;
      setUploadingVideo(true);
      setUploadProgress({ label: "동영상", percent: 0, startedAt: Date.now() });

      const intent = await createPostVideoUploadUrl({
        filename: file.name,
        contentType,
        size: file.size,
      });

      if (videoUploadCancelledRef.current) {
        setUploadingVideo(false);
        setUploadProgress(null);
        return;
      }

      if ("error" in intent) {
        toast.error(intent.error);
        setUploadingVideo(false);
        setUploadProgress(null);
        return;
      }

      const putResponse = await new Promise<boolean>((resolve) => {
        const xhr = new XMLHttpRequest();
        videoUploadXhrRef.current = xhr;
        xhr.open("PUT", intent.uploadUrl);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
          setUploadProgress((prev) =>
            prev && prev.label === "동영상" ? { ...prev, percent } : prev,
          );
        };
        xhr.onload = () => {
          videoUploadXhrRef.current = null;
          resolve(xhr.status >= 200 && xhr.status < 300);
        };
        xhr.onerror = () => {
          videoUploadXhrRef.current = null;
          resolve(false);
        };
        xhr.onabort = () => {
          videoUploadXhrRef.current = null;
          resolve(false);
        };
        xhr.send(file);
      });

      if (videoUploadCancelledRef.current) {
        return;
      }

      if (!putResponse) {
        toast.error("영상 업로드에 실패했습니다.");
        setUploadingVideo(false);
        setUploadProgress(null);
        return;
      }

      const insertedVideo = insertVideoAtCursor(intent.publicUrl);
      setUploadingVideo(false);
      setUploadProgress(null);
      if (insertedVideo) {
        const previewUrl = URL.createObjectURL(file);
        setPosterSelector({
          file,
          videoElement: insertedVideo,
          previewUrl,
          duration: 0,
          selectedTime: 0,
          frames: [],
          generatingFrames: true,
        });
        void createVideoFramePreviews(file)
          .then(({ frames, duration }) => {
            setPosterSelector((prev) =>
              prev
                ? {
                  ...prev,
                  frames,
                  duration,
                  generatingFrames: false,
                  selectedTime: duration / 2,
                }
                : prev,
            );
          })
          .catch(() => {
            setPosterSelector((prev) =>
              prev ? { ...prev, frames: [], generatingFrames: false } : prev,
            );
          });
      }
    },
    [insertVideoAtCursor],
  );

  const cancelVideoUpload = useCallback(() => {
    videoUploadCancelledRef.current = true;
    videoUploadXhrRef.current?.abort();
    videoUploadXhrRef.current = null;
    setUploadingVideo(false);
    setUploadProgress(null);
    toast.info("영상 업로드가 취소되었습니다.");
  }, []);

  const applySelectedPoster = useCallback(async () => {
    if (!posterSelector) return;

    try {
      setSavingPoster(true);
      const frameBlob = await createVideoFrameBlob(posterSelector.file, posterSelector.selectedTime);
      const posterFile = new File([frameBlob], `${posterSelector.file.name}.jpg`, {
        type: "image/jpeg",
      });

      const intent = await createPostImageUploadUrl({
        filename: posterFile.name,
        contentType: posterFile.type,
        size: posterFile.size,
      });

      if ("error" in intent) {
        toast.error(intent.error);
        return;
      }

      const putResponse = await fetch(intent.uploadUrl, {
        method: "PUT",
        body: posterFile,
        headers: { "Content-Type": posterFile.type },
      });

      if (!putResponse.ok) {
        toast.error("썸네일 업로드에 실패했습니다.");
        return;
      }

      posterSelector.videoElement.poster = intent.publicUrl;
      onInput();
      URL.revokeObjectURL(posterSelector.previewUrl);
      setPosterSelector(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "썸네일 생성에 실패했습니다.");
    } finally {
      setSavingPoster(false);
    }
  }, [onInput, posterSelector]);

  const updatePosterTimeFromClientX = useCallback((clientX: number) => {
    const strip = posterStripRef.current;
    if (!strip || !posterSelector) return;

    const rect = strip.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const maxTime = posterSelector.duration || posterSelector.frames.at(-1)?.time || 0;
    const time = ratio * maxTime;

    setPosterSelector((prev) => (prev ? { ...prev, selectedTime: time } : prev));
  }, [posterSelector]);

  const handlePosterStripPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      isDraggingPosterRef.current = true;
      setIsDraggingPoster(true);
      updatePosterTimeFromClientX(event.clientX);
    },
    [updatePosterTimeFromClientX],
  );

  const handlePosterStripPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingPosterRef.current) return;
      updatePosterTimeFromClientX(event.clientX);
    },
    [updatePosterTimeFromClientX],
  );

  const handlePosterStripPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    isDraggingPosterRef.current = false;
    setIsDraggingPoster(false);
  }, []);

  const posterScrubRatio =
    posterSelector && posterSelector.duration > 0
      ? posterSelector.selectedTime / posterSelector.duration
      : 0;

  return (
    <div className="rounded-lg bg-white dark:bg-zinc-900">
      <div className="relative" data-editor-overlay-root="">
        <div className="relative" data-editor-scroll-host="">
        {posterSelector && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-lg font-semibold text-white">커버 사진</p>
                <span className="text-sm font-medium text-blue-300">드래그로 선택</span>
              </div>

              {posterSelector.generatingFrames ? (
                <div className="rounded-lg bg-zinc-900 px-3 py-10 text-center text-sm text-zinc-300">
                  썸네일 프레임을 준비하는 중...
                </div>
              ) : (
                <>
                  <div
                    ref={posterStripRef}
                    role="slider"
                    aria-label="커버 프레임 선택"
                    aria-valuemin={0}
                    aria-valuemax={posterSelector.duration}
                    aria-valuenow={posterSelector.selectedTime}
                    className={`relative touch-none select-none overflow-hidden rounded-xl bg-black/40 p-2 ${isDraggingPoster ? "cursor-grabbing" : "cursor-grab"
                      }`}
                    onPointerDown={handlePosterStripPointerDown}
                    onPointerMove={handlePosterStripPointerMove}
                    onPointerUp={handlePosterStripPointerUp}
                    onPointerCancel={handlePosterStripPointerUp}
                  >
                    <div className="flex gap-0.5">
                      {posterSelector.frames.map((frame) => (
                        <div key={frame.time} className="h-20 min-w-0 flex-1 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element -- 캔버스 생성 프리뷰 data URL */}
                          <img src={frame.previewUrl} alt="" className="h-full w-full object-cover" draggable={false} />
                        </div>
                      ))}
                    </div>

                    <div
                      className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_2px_rgba(0,0,0,0.35)]"
                      style={{ left: `calc(${posterScrubRatio * 100}% - 1px)` }}
                    />
                    <div
                      className="pointer-events-none absolute top-1/2 h-24 w-16 -translate-y-1/2 rounded-md border-2 border-white shadow-lg"
                      style={{ left: `calc(${posterScrubRatio * 100}% - 2rem)` }}
                    />
                  </div>

                  <p className="mt-2 text-right text-xs text-zinc-400">
                    {posterSelector.selectedTime.toFixed(2)}s / {posterSelector.duration.toFixed(1)}s
                  </p>
                </>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(posterSelector.previewUrl);
                    setPosterSelector(null);
                  }}
                  className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={savingPoster || posterSelector.generatingFrames}
                  onClick={() => void applySelectedPoster()}
                  className="rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-400 disabled:opacity-50"
                >
                  {savingPoster ? "적용 중..." : "완료"}
                </button>
              </div>
            </div>
          </div>
        )}
        {uploadProgress && (
          <div
            className={`absolute right-3 top-3 z-20 w-56 rounded-lg border border-zinc-200 bg-white/95 p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900/95 ${uploadProgress.label === "동영상" ? "pointer-events-auto" : "pointer-events-none"
              }`}
          >
            <div className="mb-2 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
              <span>{uploadProgress.label} 업로드 중</span>
              <span>{elapsedSeconds}s</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-150"
                style={{ width: `${uploadProgress.percent}%` }}
              />
            </div>
            <p className="mt-1 text-right text-[11px] text-zinc-500 dark:text-zinc-400">
              {uploadProgress.percent}%
            </p>
            {uploadProgress.label === "동영상" && (
              <button
                type="button"
                onClick={cancelVideoUpload}
                className="mt-2 w-full rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                취소
              </button>
            )}
          </div>
        )}
        {(isEmpty || errorMessage) && (
          <div
            aria-hidden={!errorMessage}
            role={errorMessage ? "alert" : undefined}
            className={`pointer-events-none absolute inset-0 font-sans text-base ${
              errorMessage ? "text-red-600 dark:text-red-400" : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {errorMessage ?? (
              <>
                {placeholder}
                <span className="text-red-600 dark:text-red-500">*</span>
              </>
            )}
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
          onKeyDown={handleEditorKeyDown}
          className={`min-h-[200px] outline-none ${postContentProseClass} ${postContentEditorExtraClass}`}
        />
        </div>
        {selectedImage && (
          <EditorImageOverlay
            showResize={selectedImage instanceof HTMLImageElement}
            deletePosition={deleteButtonPosition}
            resizePosition={resizeHandlePosition}
            onDelete={removeSelectedImage}
            onResizePointerDown={startImageResize}
          />
        )}
      </div>

      <div className="sticky bottom-0 z-40 -mx-4 mt-4 space-y-3 border-t border-zinc-200 bg-[var(--background)]/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-zinc-700">
        <div
          role="toolbar"
          aria-label="서식 도구"
          className="flex flex-wrap items-center gap-1"
        >
        <FontSizePicker onBeforeOpen={handleFontSizePointerDown} onSelect={applyFontSize} />

        <ToolbarButton
          label="굵게"
          onPointerDown={saveSelection}
          onClick={applyBold}
        >
          <span className="font-bold">B</span>
        </ToolbarButton>

        <ToolbarButton
          label="기울임"
          onPointerDown={saveSelection}
          onClick={applyItalic}
        >
          <span className="italic">I</span>
        </ToolbarButton>

        <ToolbarButton
          label="취소선"
          onPointerDown={saveSelection}
          onClick={applyStrikethrough}
        >
          <span className="line-through">S</span>
        </ToolbarButton>

        <ToolbarButton label="링크 삽입" onPointerDown={saveSelection} onClick={insertLink}>
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

        <div className="flex items-center gap-1">
          <label
            className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onMouseDown={(event) => {
              preventToolbarBlur(event);
              saveSelection();
            }}
          >
            <span className="sr-only">글자 색상</span>
            <input
              type="color"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(event) => applyColor(event.target.value)}
            />
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"
              />
            </svg>
          </label>
        </div>

        <div className="flex items-center gap-1">
          <ToolbarButton
            label="이미지 삽입"
            disabled={uploadingImage}
            onPointerDown={saveSelection}
            onClick={() => imageInputRef.current?.click()}
          >
            {uploadingImage ? (
              <span className="text-xs">…</span>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 15-5-5L5 21" />
              </svg>
            )}
          </ToolbarButton>
          <ToolbarButton
            label="동영상 삽입"
            disabled={uploadingVideo}
            onPointerDown={saveSelection}
            onClick={() => videoInputRef.current?.click()}
          >
            {uploadingVideo ? (
              <span className="text-xs">…</span>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                <rect x="3" y="5" width="15" height="14" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m18 10 3-2v8l-3-2z" />
              </svg>
            )}
          </ToolbarButton>
          <ToolbarButton label="유튜브 삽입" onPointerDown={saveSelection} onClick={insertYoutubeAtCursor}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.7-.8-2.1-.9C15.9 4.9 12 4.9 12 4.9h0s-3.9 0-6.9.2c-.4.1-1.3.1-2.1.9-.6.6-.8 2-.8 2S2 9.6 2 11.3v1.5C2 14.4 2.2 16 2.2 16s.2 1.4.8 2c.8.8 1.9.8 2.4.9 1.8.2 6.6.2 6.6.2s3.9 0 6.9-.2c.4-.1 1.3-.1 2.1-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8ZM10 14.7v-6l5.2 3-5.2 3Z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton label="왼쪽 정렬" onPointerDown={saveSelection} onClick={() => applyAlign("left")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" d="M4 6h16M4 12h10M4 18h14" />
            </svg>
          </ToolbarButton>
          <ToolbarButton label="가운데 정렬" onPointerDown={saveSelection} onClick={() => applyAlign("center")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" d="M4 6h16M7 12h10M5 18h14" />
            </svg>
          </ToolbarButton>
          <ToolbarButton label="오른쪽 정렬" onPointerDown={saveSelection} onClick={() => applyAlign("right")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" d="M4 6h16M10 12h10M6 18h14" />
            </svg>
          </ToolbarButton>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept={[...POST_IMAGE_ALLOWED_CONTENT_TYPES, ".gif"].join(",")}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void handleImageFile(file);
          }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept={`${POST_VIDEO_ALLOWED_CONTENT_TYPES.join(",")},.mov,.mp4,.webm`}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void handleVideoFile(file);
          }}
        />
        </div>
        {footer}
      </div>
    </div>
  );
}
