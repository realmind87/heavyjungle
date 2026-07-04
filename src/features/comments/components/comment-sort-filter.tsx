"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { COMMENT_SORT_LABELS, type CommentSort } from "@/features/comments/comment-sort";

type CommentSortFilterProps = {
  sort: CommentSort;
  listParam?: string;
};

const SORT_OPTIONS = Object.keys(COMMENT_SORT_LABELS) as CommentSort[];

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M7 12h10M11 18h2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l4 4L19 6" />
    </svg>
  );
}

export function CommentSortFilter({ sort, listParam }: CommentSortFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  function applySort(next: CommentSort) {
    const params = new URLSearchParams();
    if (listParam) params.set("list", listParam);
    if (next !== "latest") params.set("commentSort", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={`댓글 정렬: ${COMMENT_SORT_LABELS[sort]}`}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
          open || sort !== "latest"
            ? "text-zinc-900 dark:text-zinc-100"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        }`}
      >
        <FilterIcon />
        <span>{COMMENT_SORT_LABELS[sort]}</span>
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="댓글 정렬"
          className="absolute left-0 top-full z-50 mt-1 min-w-[8.5rem] overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {SORT_OPTIONS.map((value) => {
            const selected = sort === value;
            return (
              <li key={value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => applySort(value)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                    selected ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  <span>{COMMENT_SORT_LABELS[value]}</span>
                  {selected && <CheckIcon />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
