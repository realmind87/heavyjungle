"use client";

import { useState } from "react";
import type { Item } from "@/db/schema";
import type { PaginatedResult } from "@/lib/pagination";
import { useCreateItem, useDeleteItem, useItems } from "@/hooks/use-items";

type Props = {
  initialData: PaginatedResult<Item>;
};

export function ItemsClient({ initialData }: Props) {
  const [cursor, setCursor] = useState<number | undefined>();
  const [title, setTitle] = useState("");
  const { data = initialData, isFetching } = useItems(cursor);
  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createItem.mutateAsync({ title: title.trim() });
    setTitle("");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="새 아이템 제목"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          disabled={createItem.isPending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          추가
        </button>
      </form>

      {isFetching && <p className="text-sm text-zinc-500 dark:text-zinc-400">로딩 중...</p>}

      <ul className="space-y-3">
        {data.data.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">ID: {item.id}</p>
            </div>
            <button
              onClick={() => deleteItem.mutate(item.id)}
              disabled={deleteItem.isPending}
              className="text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
            >
              삭제
            </button>
          </li>
        ))}
      </ul>

      {data.hasMore && data.nextCursor && (
        <button
          onClick={() => setCursor(data.nextCursor ?? undefined)}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          더 보기
        </button>
      )}
    </div>
  );
}
