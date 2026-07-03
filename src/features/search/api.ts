import type {
  SearchErrorResponse,
  SearchPostsResponse,
  SearchUsersResponse,
} from "@/features/search/types";

async function parseJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

/** GET /api/search/posts?q= */
export async function fetchSearchPosts(query: string, signal?: AbortSignal) {
  const response = await fetch(`/api/search/posts?q=${encodeURIComponent(query)}`, {
    signal,
  });

  if (!response.ok) {
    const body = await parseJson<SearchErrorResponse>(response).catch(() => null);
    throw new Error(body?.error ?? "게시글 검색에 실패했습니다.");
  }

  return parseJson<SearchPostsResponse>(response);
}

/** GET /api/search/users?q= */
export async function fetchSearchUsers(query: string, signal?: AbortSignal) {
  const response = await fetch(`/api/search/users?q=${encodeURIComponent(query)}`, {
    signal,
  });

  if (!response.ok) {
    const body = await parseJson<SearchErrorResponse>(response).catch(() => null);
    throw new Error(body?.error ?? "사용자 검색에 실패했습니다.");
  }

  return parseJson<SearchUsersResponse>(response);
}
