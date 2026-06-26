import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { LoadMorePosts } from "@/features/posts/components/load-more-posts";
import { PostList } from "@/features/posts/components/post-list";
import { listRecentPosts } from "@/features/posts/queries";
import { getCurrentUser } from "@/server/auth/current-user";

type PageProps = {
  searchParams: Promise<{ cursor?: string }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const { cursor } = await searchParams;
  const [user, postsPage] = await Promise.all([
    getCurrentUser(),
    listRecentPosts({ cursor, limit: 20 }),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <section>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">전체 최신글</h2>
            {user && (
              <Link
                href="/write"
                className="shrink-0 border px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                글쓰기
              </Link>
            )}
          </div>
        </section>

        <section className="mt-12">
          <div className="mt-4">
            <PostList posts={postsPage.items} />
            <LoadMorePosts nextCursor={postsPage.nextCursor} />
          </div>
        </section>
      </main>
    </div>
  );
}
