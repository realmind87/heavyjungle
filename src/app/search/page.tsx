import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { searchPosts, searchUsers } from "@/features/search/queries";
import type { SearchMode } from "@/features/search/types";
import { formatRelativeTime } from "@/lib/time";
import { mutedTextClass, outlineChipClass, pageTitleClass } from "@/lib/ui-classes";
import { getCurrentUser } from "@/server/auth/current-user";

const PAGE_SIZE = 20;

type PageProps = {
  searchParams: Promise<{ q?: string; type?: string; offset?: string }>;
};

function buildSearchHref(q: string, type: SearchMode, offset = 0) {
  const params = new URLSearchParams({ q, type });
  if (offset > 0) params.set("offset", String(offset));
  return `/search?${params.toString()}`;
}

function highlightExcerpt(text: string, query: string) {
  const lower = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lower.indexOf(lowerQuery);
  if (index < 0) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-500/30">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q: rawQuery, type: rawType, offset: rawOffset } = await searchParams;
  const q = (rawQuery ?? "").trim();
  const type: SearchMode = rawType === "user" ? "user" : "post";
  const offset = Math.max(Number(rawOffset) || 0, 0);

  const user = await getCurrentUser();

  const [postsPage, usersPage] = q
    ? await Promise.all([
        type === "post"
          ? searchPosts(q, user?.id, { limit: PAGE_SIZE, offset })
          : Promise.resolve({ items: [], hasMore: false }),
        type === "user"
          ? searchUsers(q, user?.id, { limit: PAGE_SIZE, offset })
          : Promise.resolve({ items: [], hasMore: false }),
      ])
    : [{ items: [], hasMore: false }, { items: [], hasMore: false }];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-8 pb-20 md:pb-8">
        <h1 className={pageTitleClass}>
          {q ? (
            <>
              <span className="text-zinc-500 dark:text-zinc-400">검색:</span> {q}
            </>
          ) : (
            "검색"
          )}
        </h1>

        {!q ? (
          <p className={`mt-4 ${mutedTextClass}`}>검색어를 입력해 주세요.</p>
        ) : (
          <>
            <div
              role="tablist"
              aria-label="검색 결과 종류"
              className="mt-6 flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-700"
            >
              <Link
                href={buildSearchHref(q, "post")}
                role="tab"
                aria-selected={type === "post"}
                className={`relative shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition ${
                  type === "post"
                    ? "text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                게시글
                {type === "post" && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-900 dark:bg-zinc-100" />
                )}
              </Link>
              <Link
                href={buildSearchHref(q, "user")}
                role="tab"
                aria-selected={type === "user"}
                className={`relative shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition ${
                  type === "user"
                    ? "text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                사용자
                {type === "user" && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-900 dark:bg-zinc-100" />
                )}
              </Link>
            </div>

            <div className="mt-4">
              {type === "post" ? (
                postsPage.items.length === 0 ? (
                  <p className={`py-8 text-center ${mutedTextClass}`}>검색 결과가 없습니다.</p>
                ) : (
                  <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {postsPage.items.map((post) => (
                      <li key={post.id} className="py-4">
                        <Link href={`/posts/${post.id}`} className="block">
                          <p className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
                            {highlightExcerpt(post.title, q)}
                          </p>
                          {post.excerpt && (
                            <p className={`mt-1 line-clamp-2 text-sm ${mutedTextClass}`}>
                              {highlightExcerpt(post.excerpt, q)}
                            </p>
                          )}
                          <p className={`mt-1.5 text-xs ${mutedTextClass}`}>
                            {post.author.displayName ?? post.author.username}
                            <span className="mx-1">·</span>
                            <time dateTime={post.createdAt}>{formatRelativeTime(post.createdAt)}</time>
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )
              ) : usersPage.items.length === 0 ? (
                <p className={`py-8 text-center ${mutedTextClass}`}>검색 결과가 없습니다.</p>
              ) : (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {usersPage.items.map((item) => {
                    const displayName = item.displayName ?? item.username;
                    return (
                      <li key={item.id} className="py-3">
                        <Link href={`/u/${item.username}`} className="flex items-center gap-3">
                          <ProfileAvatar name={displayName} avatarUrl={item.avatarUrl} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-zinc-900 dark:text-zinc-50">
                              {highlightExcerpt(displayName, q)}
                            </span>
                            <span className={`block truncate text-sm ${mutedTextClass}`}>
                              @{highlightExcerpt(item.username, q)}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {((type === "post" && postsPage.hasMore) || (type === "user" && usersPage.hasMore)) && (
              <div className="mt-6 text-center">
                <Link href={buildSearchHref(q, type, offset + PAGE_SIZE)} className={outlineChipClass}>
                  더 보기
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
