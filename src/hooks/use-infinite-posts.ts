"use client";

import { useCallback, useRef, useState } from "react";
import { POSTS_PAGE_SIZE, POSTS_TOTAL, type Post } from "@/lib/posts";

type PostsResponse = {
  posts: Post[];
  hasMore: boolean;
};

// 클라이언트 메모리/DOM 부하 제한 (Vercel API 호출 횟수도 함께 감소)
export const POSTS_MAX_LOADED = 45;

export function useInfinitePosts(initialPosts: Post[]) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(
    initialPosts.length < POSTS_TOTAL && initialPosts.length < POSTS_MAX_LOADED,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRef = useRef(initialPosts.length);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    if (startRef.current >= POSTS_MAX_LOADED) {
      setHasMore(false);
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    const currentStart = startRef.current;

    try {
      const res = await fetch(`/api/posts?start=${currentStart}&limit=${POSTS_PAGE_SIZE}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = (await res.json()) as PostsResponse;

      setPosts((prev) => {
        const existingIds = new Set(prev.map((post) => post.id));
        const next = data.posts.filter((post) => !existingIds.has(post.id));
        const merged = [...prev, ...next];
        return merged.slice(0, POSTS_MAX_LOADED);
      });

      const fetchedCount = data.posts.length;
      startRef.current = currentStart + fetchedCount;

      const reachedMax = startRef.current >= POSTS_MAX_LOADED;
      setHasMore(data.hasMore && !reachedMax && fetchedCount > 0);
    } catch {
      setError("게시글을 불러오지 못했습니다.");
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [hasMore]);

  return { posts, loadMore, hasMore, isLoading, error };
}
