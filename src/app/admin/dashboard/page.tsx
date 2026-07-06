import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/features/admin/components/admin-dashboard";
import { getAdminAnalyticsDashboard } from "@/features/admin/analytics";
import { SiteHeader } from "@/components/layout/site-header";
import { linkMutedClass, pageTitleClass } from "@/lib/ui-classes";
import { getUmamiAnalytics } from "@/server/analytics/umami";
import { getCurrentUser } from "@/server/auth/current-user";
import { requireAdmin } from "@/server/auth/permissions";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/admin/dashboard");
  }

  if (!requireAdmin(user)) {
    redirect("/");
  }

  const [analytics, umami] = await Promise.all([getAdminAnalyticsDashboard(), getUmamiAnalytics()]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/admin" className={linkMutedClass}>
              ← 관리자
            </Link>
            <h1 className={`mt-4 ${pageTitleClass}`}>운영 대시보드</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              커뮤니티 지표와 방문자 분석을 확인합니다. 집계는 약 5분마다 갱신됩니다.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
          >
            모더레이션 패널
          </Link>
        </div>
        <div className="mt-8">
          <AdminDashboard analytics={analytics} umami={umami} />
        </div>
      </main>
    </div>
  );
}
