"use client";

import { useCallback, useState } from "react";
import { POSTS_PAGE_SIZE, POSTS_TOTAL, type Post } from "@/lib/posts";

type PostsResponse = {
  posts: Post[];
  hasMore: boolean;
};

export function useInfinitePosts(initialPosts: Post[]) {
  const [posts, setPosts] = useState(initialPosts);
  const [start, setStart] = useState(initialPosts.length);
  const [hasMore, setHasMore] = useState(initialPosts.length < POSTS_TOTAL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/posts?start=${start}&limit=${POSTS_PAGE_SIZE}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = (await res.json()) as PostsResponse;
      setPosts((prev) => [...prev, ...data.posts]);
      setStart((prev) => prev + data.posts.length);
      setHasMore(data.hasMore);
    } catch {
      setError("게시글을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, start]);

  return { posts, loadMore, hasMore, isLoading, error };
}
