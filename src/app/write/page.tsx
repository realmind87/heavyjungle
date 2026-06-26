import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { PostCreateForm } from "@/features/posts/components/post-create-form";
import { getCurrentUser } from "@/server/auth/current-user";

export default async function WritePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/write");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← 홈
        </Link>
        <h1 className="mt-4 text-2xl font-bold">글 작성</h1>
        <p className="mt-2 text-sm text-zinc-500">{user.username}님으로 작성합니다.</p>
        <div className="mt-6">
          <PostCreateForm />
        </div>
      </main>
    </div>
  );
}
