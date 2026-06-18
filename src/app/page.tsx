import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PostsView } from "@/components/posts/posts-view";
import { getPosts, POSTS_PAGE_SIZE } from "@/lib/posts";

export default async function HomePage() {
  const posts = await getPosts(POSTS_PAGE_SIZE);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12 lg:py-16">
        <section className="space-y-2 sm:space-y-3">
          <Link
            href="/items"
            className="inline-block text-sm text-blue-600 hover:underline sm:text-base"
          >
            Items CRUD 데모 →
          </Link>
        </section>

        <PostsView initialPosts={posts} />
      </main>
    </div>
  );
}
