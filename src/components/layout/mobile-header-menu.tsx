"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  buildPostListHref,
  parsePostListUiState,
  type PostListFeed,
} from "@/features/posts/post-list-state";
import { useDismissOnEscape } from "@/hooks/use-a11y";
import { useThemeMode } from "@/hooks/use-theme-mode";

type MobileHeaderMenuProps = {
  isLoggedIn: boolean;
  onLoginClick?: (next?: string) => void;
};

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

function AllPostsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

function FollowingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      />
    </svg>
  );
}

function NoticeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l18-5v12L3 14v-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.6 16.8a3 3 0 0 1-5.8-1.6" />
    </svg>
  );
}

function FeedMenuIcon({ id }: { id: PostListFeed }) {
  return id === "all" ? <AllPostsIcon /> : <FollowingIcon />;
}

const FEED_ITEMS: Array<{ id: PostListFeed; label: string }> = [
  { id: "all", label: "전체글" },
  { id: "following", label: "팔로우글" },
];

/** 모바일 헤더 — 피드 전환 + 다크모드 */
export function MobileHeaderMenu({ isLoggedIn, onLoginClick }: MobileHeaderMenuProps) {
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { mounted, isDark, setThemeMode } = useThemeMode();

  const listState = parsePostListUiState({
    sort: searchParams.get("sort") ?? undefined,
    view: searchParams.get("view") ?? undefined,
    feed: searchParams.get("feed") ?? undefined,
  });

  const isHome = pathname === "/";
  const isNotices = pathname.startsWith("/notices");

  useDismissOnEscape(isOpen, () => setIsOpen(false));

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

  function closeMenu() {
    setIsOpen(false);
  }

  function handleFollowingClick(event: React.MouseEvent) {
    if (isLoggedIn) return;
    event.preventDefault();
    closeMenu();
    onLoginClick?.("/?feed=following");
  }

  return (
    <div ref={menuRef} className="relative md:hidden">
      <button
        type="button"
        aria-label="메뉴"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <MenuIcon />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label="모바일 메뉴"
          className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="p-2">
            {FEED_ITEMS.map((item) => {
              const isActive = isHome && listState.feed === item.id;
              const href =
                item.id === "following" && !isLoggedIn
                  ? "/login?next=/?feed=following"
                  : buildPostListHref({
                      feed: item.id,
                      sort: listState.sort,
                      view: listState.view,
                    });

              return (
                <Link
                  key={item.id}
                  href={href}
                  role="menuitem"
                  aria-current={isActive ? "page" : undefined}
                  onClick={(event) => {
                    if (item.id === "following" && !isLoggedIn) {
                      handleFollowingClick(event);
                      return;
                    }
                    closeMenu();
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className={isActive ? "" : "text-zinc-500 dark:text-zinc-400"}>
                    <FeedMenuIcon id={item.id} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/notices"
              role="menuitem"
              aria-current={isNotices ? "page" : undefined}
              onClick={closeMenu}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isNotices
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              <span className={isNotices ? "" : "text-zinc-500 dark:text-zinc-400"}>
                <NoticeIcon />
              </span>
              공지사항
            </Link>
          </div>

          <div className="border-t border-zinc-200 p-2 dark:border-zinc-700">
            <button
              type="button"
              role="menuitem"
              disabled={!mounted}
              onClick={() => setThemeMode(isDark ? "light" : "dark")}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <span className="flex items-center gap-3">
                <span className="text-zinc-500 dark:text-zinc-400">{isDark ? <SunIcon /> : <MoonIcon />}</span>
                {isDark ? "라이트 모드" : "다크 모드"}
              </span>
              <span
                aria-hidden="true"
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
                  isDark ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    isDark ? "left-5" : "left-0.5"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
