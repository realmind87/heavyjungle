import { SiteHeader } from "@/components/layout/site-header";
import { LoadMorePosts } from "@/features/posts/components/load-more-posts";
import { PostList } from "@/features/posts/components/post-list";
import { parsePostListUiState } from "@/features/posts/post-list-state";
import { listPosts } from "@/features/posts/queries";

type PageProps = {
  searchParams: Promise<{ cursor?: string; sort?: string; view?: string }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const listState = parsePostListUiState(rawParams);
  const postsPage = await listPosts({
    cursor: listState.cursor,
    limit: 20,
    sort: listState.sort,
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <section>
          <div className="mt-4">
            <PostList posts={postsPage.items} listState={listState} />
            <LoadMorePosts nextCursor={postsPage.nextCursor} listState={listState} />
          </div>
        </section>
      </main>
    </div>
  );
}
