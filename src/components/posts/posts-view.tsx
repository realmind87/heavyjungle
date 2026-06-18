"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useInfinitePosts } from "@/hooks/use-infinite-posts";
import { formatPostDate, type Post } from "@/lib/posts";

type ViewMode = "list" | "thumbnail";

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

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="보기 방식"
      className="inline-flex rounded-lg border border-zinc-200 p-1 dark:border-zinc-700"
    >
      <button
        type="button"
        aria-label="리스트로 보기"
        aria-pressed={view === "list"}
        onClick={() => onChange("list")}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
          view === "list"
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
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
          view === "thumbnail"
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        }`}
      >
        <ThumbnailIcon />
      </button>
    </div>
  );
}

function ThumbnailPlaceholder({ id }: { id: number }) {
  const hues = ["bg-blue-100 dark:bg-blue-950", "bg-emerald-100 dark:bg-emerald-950", "bg-violet-100 dark:bg-violet-950"];
  return (
    <div
      className={`flex aspect-video w-full items-center justify-center rounded-lg ${hues[(id - 1) % hues.length]}`}
    >
      <span className="text-2xl font-semibold text-zinc-400 dark:text-zinc-500">#{id}</span>
    </div>
  );
}

function PostListItem({ post }: { post: Post }) {
  return (
    <li>
      <Link
        href={`/posts/${post.id}`}
        className="flex gap-4 rounded-xl border border-zinc-200 p-4 transition hover:border-zinc-300 hover:bg-zinc-50 sm:p-5 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/50"
      >
        <div className="min-w-0 flex-1">
          <h2 className="font-medium text-zinc-900 sm:text-base dark:text-zinc-100">{post.title}</h2>
          <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{post.body}</p>
          <span className="mt-2 block text-xs text-zinc-500 dark:text-zinc-400">
            {formatPostDate(post.createdAt)}
          </span>
        </div>
      </Link>
    </li>
  );
}

function PostThumbnailItem({ post }: { post: Post }) {
  return (
    <li>
      <Link
        href={`/posts/${post.id}`}
        className="block overflow-hidden rounded-xl border border-zinc-200 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/50"
      >
        <div className="p-3 pb-0 sm:p-4 sm:pb-0">
          <ThumbnailPlaceholder id={post.id} />
        </div>
        <div className="flex flex-col p-4 sm:p-5">
          <h2 className="line-clamp-2 h-10 text-sm font-medium leading-5 sm:h-12 sm:text-base sm:leading-6">
            {post.title}
          </h2>
          <p className="mt-2 line-clamp-3 h-[3.75rem] text-xs leading-5 text-zinc-600 sm:h-[4.5rem] sm:text-sm sm:leading-6 dark:text-zinc-400">
            {post.body}
          </p>
          <span className="mt-2 block text-xs text-zinc-500 dark:text-zinc-400">
            {formatPostDate(post.createdAt)}
          </span>
        </div>
      </Link>
    </li>
  );
}

export function PostsView({ initialPosts }: { initialPosts: Post[] }) {
  const [view, setView] = useState<ViewMode>("thumbnail");
  const { posts, loadMore, hasMore, isLoading, error } = useInfinitePosts(initialPosts);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-end">
        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === "list" ? (
        <ul className="flex flex-col gap-3 sm:gap-4">
          {posts.map((post) => (
            <PostListItem key={post.id} post={post} />
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostThumbnailItem key={post.id} post={post} />
          ))}
        </ul>
      )}

      <div ref={sentinelRef} className="h-1" aria-hidden="true" />

      <div className="flex justify-center py-4">
        {isLoading && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">게시글 불러오는 중...</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!hasMore && !isLoading && posts.length > 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">모든 게시글을 불러왔습니다.</p>
        )}
      </div>
    </section>
  );
}
