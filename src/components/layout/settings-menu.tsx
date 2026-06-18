"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useThemeMode } from "@/hooks/use-theme-mode";

export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isDark, setThemeMode } = useThemeMode();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectTheme = useCallback(
    (mode: "light" | "dark") => {
      setThemeMode(mode);
    },
    [setThemeMode],
  );

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label="설정"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {isDark ? "다크 모드" : "라이트 모드"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isDark}
                aria-label="다크 모드 토글"
                onClick={() => selectTheme(isDark ? "light" : "dark")}
                className={`relative h-7 w-12 shrink-0 rounded-full ${
                  isDark ? "bg-zinc-700" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${
                    isDark ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
