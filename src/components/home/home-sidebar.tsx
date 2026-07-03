"use client";

import Link from "next/link";
import {
  buildPostListHref,
  type PostListFeed,
  type PostListUiState,
} from "@/features/posts/post-list-state";

type FeedMenuItem = {
  id: PostListFeed;
  label: string;
  description: string;
};

const FEED_MENU: FeedMenuItem[] = [
  {
    id: "all",
    label: "전체 글",
    description: "모든 회원의 글",
  },
  {
    id: "following",
    label: "팔로우 글 보기",
    description: "팔로우한 회원의 글",
  },
];

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

function FeedMenuIcon({ id }: { id: PostListFeed }) {
  return id === "all" ? <AllPostsIcon /> : <FollowingIcon />;
}

type HomeSidebarProps = {
  listState: PostListUiState;
};

/** 홈 피드 서브메뉴 — 전체 / 팔로우 글 */
export function HomeSidebar({ listState }: HomeSidebarProps) {
  return (
    <nav
      aria-label="피드 메뉴"
      className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        피드
      </p>

      <ul className="space-y-1">
        {FEED_MENU.map((item) => {
          const isActive = listState.feed === item.id;
          const href = buildPostListHref({
            feed: item.id,
            sort: listState.sort,
            view: listState.view,
          });

          return (
            <li key={item.id}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                <span className={`mt-0.5 shrink-0 ${isActive ? "" : "text-zinc-500 dark:text-zinc-400"}`}>
                  <FeedMenuIcon id={item.id} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span
                    className={`mt-0.5 block text-xs ${
                      isActive
                        ? "text-zinc-300 dark:text-zinc-600"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {item.description}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
