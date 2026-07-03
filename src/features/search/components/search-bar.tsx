"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { useSearch } from "@/features/search/use-search";
import type { SearchPost, SearchUser } from "@/features/search/types";
import { formatRelativeTime } from "@/lib/time";
import { inputClass, mutedTextClass } from "@/lib/ui-classes";

function highlightText(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = q.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index < 0) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + q.length);
  const after = text.slice(index + q.length);

  return (
    <>
      {before}
      <mark className="rounded bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-500/30">{match}</mark>
      {after}
    </>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-600 dark:border-t-zinc-200"
      aria-hidden="true"
    />
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m20 20-3-3" />
    </svg>
  );
}

type SearchBarProps = {
  className?: string;
};

/** 헤더 검색 — 게시글 제목 / @유저 자동완성 */
export function SearchBar({ className = "" }: SearchBarProps) {
  const router = useRouter();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    input,
    setInput,
    mode,
    posts,
    users,
    isLoading,
    error,
    isOpen,
    setIsOpen,
    activeIndex,
    setActiveIndex,
    resultCount,
    clearResults,
  } = useSearch();

  const queryForHighlight = mode === "user" ? input.slice(1).trim() : input.trim();
  const showDropdown = isOpen && input.trim().length > 0;

  function closeDropdown() {
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function navigateToPost(post: SearchPost) {
    closeDropdown();
    setInput("");
    clearResults();
    router.push(`/posts/${post.id}`);
  }

  function navigateToUser(user: SearchUser) {
    closeDropdown();
    setInput("");
    clearResults();
    router.push(`/u/${user.username}`);
  }

  function selectActiveItem() {
    if (mode === "post") {
      const post = posts[activeIndex] ?? posts[0];
      if (post) navigateToPost(post);
      return;
    }

    const user = users[activeIndex] ?? users[0];
    if (user) navigateToUser(user);
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [setIsOpen, setActiveIndex]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDropdown();
      inputRef.current?.blur();
      return;
    }

    if (!showDropdown || resultCount === 0) {
      if (event.key === "Enter") {
        event.preventDefault();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(activeIndex < 0 ? 0 : (activeIndex + 1) % resultCount);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(activeIndex <= 0 ? resultCount - 1 : activeIndex - 1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      selectActiveItem();
    }
  }

  return (
    <div ref={containerRef} className={`relative min-w-0 flex-1 ${className}`}>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400 dark:text-zinc-500">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="search"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            if (event.target.value.trim()) setIsOpen(true);
          }}
          onFocus={() => {
            if (input.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="게시글 검색, @유저 검색"
          aria-label="검색"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={showDropdown}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          role="combobox"
          autoComplete="off"
          className={`${inputClass} h-10 pl-9 pr-9`}
        />
        {isLoading && (
          <span className="absolute inset-y-0 right-3 flex items-center">
            <Spinner />
            <span className="sr-only">검색 중</span>
          </span>
        )}
      </div>

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={mode === "post" ? "게시글 검색 결과" : "사용자 검색 결과"}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[min(24rem,70vh)] overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {error ? (
            <p className="px-3 py-4 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : isLoading && resultCount === 0 ? (
            <p className={`px-3 py-4 text-center ${mutedTextClass}`}>검색 중...</p>
          ) : resultCount === 0 ? (
            <p className={`px-3 py-4 text-center ${mutedTextClass}`}>검색 결과가 없습니다</p>
          ) : mode === "post" ? (
            posts.map((post, index) => {
              const isActive = index === activeIndex;
              const authorName = post.author.displayName ?? post.author.username;
              return (
                <button
                  key={post.id}
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => navigateToPost(post)}
                  className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition ${
                    isActive ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <span className="line-clamp-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {highlightText(post.title, queryForHighlight)}
                  </span>
                  <span className={`text-xs ${mutedTextClass}`}>
                    {authorName}
                    <span className="mx-1">·</span>
                    <time dateTime={post.createdAt}>{formatRelativeTime(post.createdAt)}</time>
                  </span>
                </button>
              );
            })
          ) : (
            users.map((user, index) => {
              const isActive = index === activeIndex;
              const displayName = user.displayName ?? user.username;
              return (
                <button
                  key={user.id}
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => navigateToUser(user)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                    isActive ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <ProfileAvatar name={displayName} avatarUrl={user.avatarUrl} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {highlightText(displayName, queryForHighlight)}
                    </span>
                    <span className={`block truncate text-xs ${mutedTextClass}`}>
                      @{highlightText(user.username, queryForHighlight)}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
