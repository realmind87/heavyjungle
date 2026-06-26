import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { PostCreateForm } from "@/features/posts/components/post-create-form";
import { getCurrentUser } from "@/server/auth/current-user";
import { linkMutedClass } from "@/lib/ui-classes";

export default async function WritePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/write");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/" className={linkMutedClass}>
          ← 홈
        </Link>
        <div className="mt-6">
          <PostCreateForm />
        </div>
      </main>
    </div>
  );
}
