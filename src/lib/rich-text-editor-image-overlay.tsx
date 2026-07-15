"use client";

import type { PointerEvent } from "react";

type OverlayPoint = { top: number; left: number };

type EditorImageOverlayProps = {
  showResize: boolean;
  deletePosition: OverlayPoint | null;
  resizePosition: OverlayPoint | null;
  onDelete: () => void;
  onResizePointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  compact?: boolean;
};

/** 에디터 내 선택된 이미지 — 삭제·크기 조절 오버레이 */
export function EditorImageOverlay({
  showResize,
  deletePosition,
  resizePosition,
  onDelete,
  onResizePointerDown,
  compact = false,
}: EditorImageOverlayProps) {
  if (!deletePosition) return null;

  const deleteSize = compact ? "h-5 w-5" : "h-6 w-6";
  const deleteIcon = compact ? "h-3 w-3" : "h-3.5 w-3.5";
  const resizeSize = compact ? "h-4 w-4" : "h-5 w-5";

  return (
    <>
      <button
        type="button"
        aria-label="이미지 삭제"
        title="이미지 삭제"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => void onDelete()}
        className={`absolute z-30 inline-flex ${deleteSize} items-center justify-center rounded-full bg-red-500 text-white shadow transition hover:bg-red-600`}
        style={{ top: deletePosition.top, left: deletePosition.left }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={deleteIcon} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {showResize && resizePosition && (
        <button
          type="button"
          aria-label="이미지 크기 조절"
          title="드래그하여 크기 조절"
          onPointerDown={onResizePointerDown}
          className={`absolute z-30 ${resizeSize} touch-none cursor-se-resize rounded-sm border-2 border-white bg-blue-500 shadow`}
          style={{ top: resizePosition.top, left: resizePosition.left }}
        />
      )}
    </>
  );
}
