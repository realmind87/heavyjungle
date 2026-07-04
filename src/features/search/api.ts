import type {
  SearchErrorResponse,
  SearchPostsResponse,
  SearchUsersResponse,
} from "@/features/search/types";

type SearchFetchOptions = {
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
};

async function parseJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

function buildSearchUrl(path: string, query: string, options: SearchFetchOptions = {}) {
  const params = new URLSearchParams({ q: query });
  if (options.limit) params.set("limit", String(options.limit));
  if (options.offset) params.set("offset", String(options.offset));
  return `${path}?${params.toString()}`;
}

/** GET /api/search/posts?q= */
export async function fetchSearchPosts(query: string, signalOrOptions?: AbortSignal | SearchFetchOptions) {
  const options: SearchFetchOptions =
    signalOrOptions instanceof AbortSignal ? { signal: signalOrOptions } : (signalOrOptions ?? {});
  const response = await fetch(buildSearchUrl("/api/search/posts", query, options), {
    signal: options.signal,
  });

  if (!response.ok) {
    const body = await parseJson<SearchErrorResponse>(response).catch(() => null);
    throw new Error(body?.error ?? "게시글 검색에 실패했습니다.");
  }

  return parseJson<SearchPostsResponse>(response);
}

/** GET /api/search/users?q= */
export async function fetchSearchUsers(query: string, signalOrOptions?: AbortSignal | SearchFetchOptions) {
  const options: SearchFetchOptions =
    signalOrOptions instanceof AbortSignal ? { signal: signalOrOptions } : (signalOrOptions ?? {});
  const response = await fetch(buildSearchUrl("/api/search/users", query, options), {
    signal: options.signal,
  });

  if (!response.ok) {
    const body = await parseJson<SearchErrorResponse>(response).catch(() => null);
    throw new Error(body?.error ?? "사용자 검색에 실패했습니다.");
  }

  return parseJson<SearchUsersResponse>(response);
}
