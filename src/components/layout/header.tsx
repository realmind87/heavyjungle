"use client";

import Link from "next/link";
import { useState } from "react";
import { SettingsMenu } from "@/components/layout/settings-menu";

function AuthButtons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      <Link
        href="/login"
        className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:px-4"
      >
        로그인
      </Link>
      <Link
        href="/signup"
        className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 sm:px-4"
      >
        회원가입
      </Link>
    </div>
  );
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-xl"
        >
          배포는기도다
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <AuthButtons className="hidden md:flex" />

          <button
            type="button"
            aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-zinc-100 md:hidden dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <span className="sr-only">메뉴</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>

          <SettingsMenu />
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-zinc-200 px-4 py-4 md:hidden dark:border-zinc-800">
          <AuthButtons className="flex-col [&_a]:w-full [&_a]:text-center" />
        </div>
      )}
    </header>
  );
}
