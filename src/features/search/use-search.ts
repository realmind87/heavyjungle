"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchSearchPosts, fetchSearchUsers } from "@/features/search/api";
import type { SearchMode, SearchPost, SearchUser } from "@/features/search/types";

const DEBOUNCE_MS = 300;

export function resolveSearchMode(input: string): SearchMode {
  return input.startsWith("@") ? "user" : "post";
}

export function getSearchQuery(input: string, mode: SearchMode): string {
  if (mode === "user") {
    return input.slice(1).trim();
  }
  return input.trim();
}

type UseSearchResult = {
  input: string;
  setInput: (value: string) => void;
  mode: SearchMode;
  posts: SearchPost[];
  users: SearchUser[];
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  resultCount: number;
  clearResults: () => void;
};

export function useSearch(): UseSearchResult {
  const [input, setInputState] = useState("");
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const mode = resolveSearchMode(input);
  const query = getSearchQuery(input, mode);
  const resultCount = mode === "post" ? posts.length : users.length;

  const clearResults = useCallback(() => {
    setPosts([]);
    setUsers([]);
    setError(null);
    setActiveIndex(-1);
  }, []);

  const setInput = useCallback((value: string) => {
    setInputState(value);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (!query) {
      clearResults();
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    setIsLoading(true);
    setError(null);

    const requestId = ++requestIdRef.current;
    const timer = window.setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        if (mode === "post") {
          const data = await fetchSearchPosts(query, controller.signal);
          if (requestId !== requestIdRef.current) return;
          setPosts(data.items);
          setUsers([]);
        } else {
          const data = await fetchSearchUsers(query, controller.signal);
          if (requestId !== requestIdRef.current) return;
          setUsers(data.items);
          setPosts([]);
        }
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (requestId !== requestIdRef.current) return;
        setPosts([]);
        setUsers([]);
        setError(err instanceof Error ? err.message : "검색에 실패했습니다.");
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, mode, clearResults]);

  return {
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
  };
}
