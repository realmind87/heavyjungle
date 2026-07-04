import Link from "next/link";
import { itemsRepository } from "@/repositories/items.repository";
import { linkMutedClass, pageTitleClass } from "@/lib/ui-classes";
import { ItemsClient } from "./items-client";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const initial = await itemsRepository.findByCursor({ limit: 20 });

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <Link href="/" className={`${linkMutedClass} hover:text-zinc-700 dark:hover:text-zinc-300`}>
          ← Home
        </Link>
        <h1 className={`text-3xl font-semibold tracking-tight ${pageTitleClass}`}>Items CRUD</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Drizzle + PostgreSQL + Redis 캐시 + 커서 페이지네이션
        </p>
      </header>

      <ItemsClient initialData={initial} />
    </main>
  );
}
