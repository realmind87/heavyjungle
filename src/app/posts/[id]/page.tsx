import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { formatPostDate, getPostById } from "@/lib/posts";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;
  const postId = Number(id);

  if (!Number.isInteger(postId) || postId <= 0) {
    notFound();
  }

  const post = await getPostById(postId);
  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto w-full max-w-[1152px] px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        <Link
          href="/"
          className="inline-block text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← 목록으로
        </Link>

        <article className="mt-6 space-y-4 sm:mt-8">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatPostDate(post.createdAt)}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{post.title}</h1>
          <p className="whitespace-pre-line text-base leading-7 text-zinc-600 dark:text-zinc-300">
            {post.body}
          </p>
        </article>
      </main>
    </div>
  );
}
