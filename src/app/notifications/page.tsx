import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { NotificationsList } from "@/features/notifications/components/notifications-list";
import { listNotificationsPage } from "@/features/notifications/queries";
import { getCurrentUser } from "@/server/auth/current-user";
import { linkMutedClass } from "@/lib/ui-classes";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/notifications");

  const { items, hasMore } = await listNotificationsPage(user.id, { limit: 20 });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 pb-20 md:pb-8">
        <Link href="/" className={linkMutedClass}>
          ← 홈
        </Link>
        <h1 className="mt-6 mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">알림</h1>
        <NotificationsList initialItems={items} initialHasMore={hasMore} />
      </main>
    </div>
  );
}
