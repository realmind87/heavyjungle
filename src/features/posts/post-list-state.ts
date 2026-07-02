/**
 * 홈 글 목록 UI 상태 — URL search params가 단일 진실 공급원(SSOT).
 *
 * 이 프로젝트 상태 관리 전략:
 * - 서버 데이터(글, 댓글 등): Server Components + Server Actions, 클라이언트 캐시는 TanStack Query (/items 등)
 * - 공유·복원 가능한 UI(정렬, 보기 방식, 페이지): URL query — 뒤로가기·북마크·SSR과 자연스럽게 맞음
 * - 전역 클라이언트 UI(Zustand 등): 아직 범위 밖 — 목록 필터/뷰는 URL로 충분
 */
import { z } from "zod";
import { parsePostSort, type PostSort } from "@/features/posts/post-sort";

export const postViewSchema = z.enum(["list", "thumbnail"]);
export type PostListView = z.infer<typeof postViewSchema>;

export type PostListUiState = {
  sort: PostSort;
  view: PostListView;
  cursor?: string;
};

export function parsePostView(value: string | undefined): PostListView {
  const parsed = postViewSchema.safeParse(value);
  return parsed.success ? parsed.data : "list";
}

export function parsePostListUiState(searchParams: {
  sort?: string;
  view?: string;
  cursor?: string;
}): PostListUiState {
  return {
    sort: parsePostSort(searchParams.sort),
    view: parsePostView(searchParams.view),
    cursor: searchParams.cursor,
  };
}

/** 홈 목록 URL 쿼리 문자열 (기본값은 생략) */
export function buildPostListQuery(state: PostListUiState): string {
  const params = new URLSearchParams();
  if (state.sort !== "latest") params.set("sort", state.sort);
  if (state.view !== "list") params.set("view", state.view);
  if (state.cursor) params.set("cursor", state.cursor);
  return params.toString();
}

export function buildPostListHref(state: PostListUiState): string {
  const query = buildPostListQuery(state);
  return query ? `/?${query}` : "/";
}

/** 글 상세 → 목록 복귀용 list 쿼리 (cursor 제외) */
export function buildPostListReturnQuery(state: Pick<PostListUiState, "sort" | "view">): string {
  return buildPostListQuery({ ...state, cursor: undefined });
}

export function buildPostDetailHref(
  postId: string,
  listState: Pick<PostListUiState, "sort" | "view">,
): string {
  const returnQuery = buildPostListReturnQuery(listState);
  const base = `/posts/${postId}`;
  return returnQuery ? `${base}?list=${encodeURIComponent(returnQuery)}` : base;
}

/** 글 상세 ?list= 파라미터 검증 후 목록 URL 생성 */
export function buildBackHrefFromListParam(list: string | undefined): string {
  const safe = sanitizeListQueryParam(list);
  return safe ? `/?${safe}` : "/";
}

function sanitizeListQueryParam(raw: string | undefined): string | null {
  if (!raw) return null;

  const params = new URLSearchParams(raw);
  const safe = new URLSearchParams();
  const sort = parsePostSort(params.get("sort") ?? undefined);
  const view = parsePostView(params.get("view") ?? undefined);

  if (sort !== "latest") safe.set("sort", sort);
  if (view !== "list") safe.set("view", view);

  const cursor = params.get("cursor");
  if (cursor && /^[A-Za-z0-9_-]+$/.test(cursor)) {
    safe.set("cursor", cursor);
  }

  const query = safe.toString();
  return query || null;
}
