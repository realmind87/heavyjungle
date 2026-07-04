import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { PostForm } from "@/features/posts/components/post-form";
import { getCurrentUser } from "@/server/auth/current-user";
import { isAdmin } from "@/server/auth/permissions";
import { linkMutedClass } from "@/lib/ui-classes";

export default async function WritePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/write");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-8 pb-12 md:pb-8">
        <Link href="/" className={linkMutedClass}>
          ← 홈
        </Link>
        <div className="mt-6">
          <PostForm mode="create" isAdmin={isAdmin(user)} />
        </div>
      </main>
    </div>
  );
}
