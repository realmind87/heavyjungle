import Link from "next/link";
import { Header } from "@/components/layout/header";

type Post = {
  id: number;
  title: string;
  body: string;
};

async function getPosts(): Promise<Post[]> {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=3", {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch posts");
  }

  return res.json();
}

export default async function HomePage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12 lg:py-16">
        <section className="space-y-2 sm:space-y-3">
          <p className="text-xs font-medium text-zinc-500 sm:text-sm">Server Component</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Deploy and Pray
          </h1>
          <p className="max-w-2xl text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
            이 페이지는 서버에서 데이터를 가져와 렌더링됩니다.
          </p>
          <Link
            href="/items"
            className="inline-block text-sm text-blue-600 hover:underline sm:text-base"
          >
            Items CRUD 데모 →
          </Link>
        </section>

        <ul className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li
              key={post.id}
              className="rounded-xl border border-zinc-200 p-4 transition hover:border-zinc-300 sm:p-5 dark:border-zinc-800 dark:hover:border-zinc-700"
            >
              <h2 className="line-clamp-2 text-sm font-medium sm:text-base">{post.title}</h2>
              <p className="mt-2 line-clamp-4 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
                {post.body}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
