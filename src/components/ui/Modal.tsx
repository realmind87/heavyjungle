"use client";

/**
 * 공용 모달 셸 — ESC·backdrop 닫기, body 스크롤 잠금, 포커스 트랩, 닫을 때 포커스 복귀.
 * Intercepting Routes용 래퍼: RouteModal.tsx (router.back() 닫기)
 */
import { useId, useRef, type ReactNode, type RefObject } from "react";
import { useModalA11y } from "@/hooks/use-a11y";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** 닫을 때 포커스를 되돌릴 트리거 요소 */
  returnFocusRef?: RefObject<HTMLElement | null>;
};

export function Modal({ open, onClose, title, children, returnFocusRef }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useModalA11y({ open, onClose, dialogRef, returnFocusRef });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
