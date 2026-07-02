import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { AdminPanel } from "@/features/admin/components/admin-panel";
import { listAdminComments, listAdminPosts, listAdminUsers } from "@/features/admin/queries";
import { linkMutedClass, pageTitleClass } from "@/lib/ui-classes";
import { getCurrentUser } from "@/server/auth/current-user";
import { requireAdmin } from "@/server/auth/permissions";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!requireAdmin(user)) {
    redirect("/");
  }

  const [posts, comments, users] = await Promise.all([
    listAdminPosts(),
    listAdminComments(),
    listAdminUsers(),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/" className={linkMutedClass}>
          ← 홈
        </Link>
        <h1 className={`mt-4 ${pageTitleClass}`}>관리자</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          글·댓글 삭제 및 사용자 권한을 관리합니다.
        </p>
        <div className="mt-8">
          <AdminPanel
            posts={posts}
            comments={comments}
            users={users}
            currentUserId={user.id}
          />
        </div>
      </main>
    </div>
  );
}
