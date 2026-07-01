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
          <div className="mt-4">
            <PostList posts={postsPage.items} />
            <LoadMorePosts nextCursor={postsPage.nextCursor} />
          </div>
        </section>
      </main>
    </div>
  );
}
