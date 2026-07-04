import { SiteHeader } from "@/components/layout/site-header";
import { HomeNotices } from "@/components/home/home-notices";
import { HomeSidebar } from "@/components/home/home-sidebar";
import { LoadMorePosts } from "@/features/posts/components/load-more-posts";
import { PostList } from "@/features/posts/components/post-list";
import { parsePostListUiState } from "@/features/posts/post-list-state";
import { listNotices, listPosts } from "@/features/posts/queries";
import { getCurrentUser } from "@/server/auth/current-user";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ cursor?: string; sort?: string; view?: string; feed?: string }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const listState = parsePostListUiState(rawParams);
  const user = await getCurrentUser();

  if (listState.feed === "following" && !user) {
    redirect("/login?next=/?feed=following");
  }

  const [postsPage, notices] = await Promise.all([
    listPosts({
      cursor: listState.cursor,
      limit: 20,
      sort: listState.sort,
      feed: listState.feed,
      viewerId: user?.id,
    }),
    listNotices(5),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8">
        <section className="flex flex-col gap-6 lg:flex-row lg:gap-8 w-full">
          <div className="min-w-0 flex-1 lg:mt-4">
            <PostList posts={postsPage.items} listState={listState} />
            <LoadMorePosts nextCursor={postsPage.nextCursor} listState={listState} />
          </div>
          <aside className="hidden w-72 max-w-xs shrink-0 lg:block">
            <div className="sticky top-20 space-y-4">
              {user && <HomeSidebar listState={listState} />}
              <HomeNotices notices={notices} />
              <p className="mt-4 text-zinc-500 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                &copy; 2026 Heavy Jungle. All rights reserved.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
