"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PostCard } from "@/features/posts/components/post-card";
import { PostThumbnailCard } from "@/features/posts/components/post-thumbnail-card";
import type { PostListItem } from "@/features/posts/queries";
import {
  buildPostListHref,
  buildPostListReturnQuery,
  type PostListUiState,
  type PostListView,
} from "@/features/posts/post-list-state";
import { POST_SORT_LABELS, type PostSort } from "@/features/posts/post-sort";
import { mutedTextClass } from "@/lib/ui-classes";

type PostListProps = {
  posts: PostListItem[];
  /** 홈 — URL과 동기화된 목록 UI 상태 */
  listState?: PostListUiState;
  showToolbar?: boolean;
};

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path strokeLinecap="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function ThumbnailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function SortFilter({
  sort,
  onChange,
}: {
  sort: PostSort;
  onChange: (sort: PostSort) => void;
}) {
  return (
    <div role="group" aria-label="정렬" className="inline-flex p-1">
      {(Object.keys(POST_SORT_LABELS) as PostSort[]).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={sort === value}
          onClick={() => onChange(value)}
          className={`rounded-md px-3 py-1.5 text-sm transition ${sort === value
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
        >
          {POST_SORT_LABELS[value]}
        </button>
      ))}
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: PostListView;
  onChange: (view: PostListView) => void;
}) {
  return (
    <div role="group" aria-label="보기 방식" className="inline-flex p-1">
      <button
        type="button"
        aria-label="리스트로 보기"
        aria-pressed={view === "list"}
        onClick={() => onChange("list")}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${view === "list"
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          }`}
      >
        <ListIcon />
      </button>
      <button
        type="button"
        aria-label="썸네일로 보기"
        aria-pressed={view === "thumbnail"}
        onClick={() => onChange("thumbnail")}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${view === "thumbnail"
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          }`}
      >
        <ThumbnailIcon />
      </button>
    </div>
  );
}

function sortPostsClient(posts: PostListItem[], sort: PostSort): PostListItem[] {
  const copy = [...posts];
  if (sort === "popular") {
    return copy.sort((a, b) => b.likeCount - a.likeCount || b.id.localeCompare(a.id));
  }
  if (sort === "oldest") {
    return copy.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
    );
  }
  return copy.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id),
  );
}

/** PostCard 목록 래퍼 — 정렬 필터 + 리스트/썸네일 토글 */
export function PostList({ posts, listState, showToolbar = true }: PostListProps) {
  const router = useRouter();
  const isUrlSynced = listState !== undefined;
  const [localSort, setLocalSort] = useState<PostSort>("latest");
  const [localView, setLocalView] = useState<PostListView>("list");

  const sort = listState?.sort ?? localSort;
  const view = listState?.view ?? localView;

  const displayPosts = useMemo(
    () => (isUrlSynced ? posts : sortPostsClient(posts, sort)),
    [isUrlSynced, posts, sort],
  );

  const returnListState = useMemo(
    () => (isUrlSynced && listState ? { sort: listState.sort, view: listState.view } : undefined),
    [isUrlSynced, listState],
  );

  function pushListState(next: Partial<Pick<PostListUiState, "sort" | "view">>) {
    if (!listState) return;
    router.push(
      buildPostListHref({
        sort: next.sort ?? listState.sort,
        view: next.view ?? listState.view,
      }),
    );
  }

  if (posts.length === 0) {
    return <p className={`py-8 text-center ${mutedTextClass}`}>글이 없습니다.</p>;
  }

  return (
    <div>
      {showToolbar && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SortFilter
            sort={sort}
            onChange={(nextSort) => {
              if (isUrlSynced) {
                pushListState({ sort: nextSort });
              } else {
                setLocalSort(nextSort);
              }
            }}
          />
          <ViewToggle
            view={view}
            onChange={(nextView) => {
              if (isUrlSynced) {
                pushListState({ view: nextView });
              } else {
                setLocalView(nextView);
              }
            }}
          />
        </div>
      )}

      {view === "list" ? (
        <div>
          {displayPosts.map((post) => (
            <PostCard key={post.id} post={post} returnListState={returnListState} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayPosts.map((post) => (
            <PostThumbnailCard key={post.id} post={post} returnListState={returnListState} />
          ))}
        </div>
      )}
    </div>
  );
}
