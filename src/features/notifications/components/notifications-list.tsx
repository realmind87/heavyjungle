"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  deleteAllNotifications,
  deleteNotification,
  markAllNotificationsRead,
} from "@/features/notifications/actions";
import {
  getNotificationHref,
  getNotificationText,
  isSystemNotification,
} from "@/features/notifications/display";
import type { NotificationItem } from "@/features/notifications/types";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { formatRelativeTime } from "@/lib/time";

const PAGE_SIZE = 20;

type NotificationsListProps = {
  initialItems: NotificationItem[];
  initialHasMore: boolean;
};

export function NotificationsList({ initialItems, initialHasMore }: NotificationsListProps) {
  const [items, setItems] = useState<NotificationItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 페이지 진입 시 모두 읽음 처리 (헤더 뱃지 동기화)
    void markAllNotificationsRead();
  }, []);

  async function loadMore() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(items.length),
      });
      const res = await fetch(`/api/notifications?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: NotificationItem[]; hasMore: boolean };
      setItems((prev) => [...prev, ...data.items]);
      setHasMore(data.hasMore);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const prev = items;
    setItems((current) => current.filter((item) => item.id !== id));
    const result = await deleteNotification(id);
    if (result.error) setItems(prev);
  }

  async function handleClearAll() {
    if (items.length === 0) return;
    const prev = items;
    setItems([]);
    setHasMore(false);
    const result = await deleteAllNotifications();
    if (result.error) setItems(prev);
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-200 px-4 py-16 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        알림이 없습니다.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={handleClearAll}
          className="text-sm text-zinc-500 transition hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
        >
          전체 삭제
        </button>
      </div>

      <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-1">
            <Link
              href={getNotificationHref(item)}
              className={`flex flex-1 items-start gap-3 px-4 py-3.5 text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                item.isRead ? "" : "bg-zinc-50 dark:bg-zinc-800/60"
              }`}
            >
              {isSystemNotification(item.type) ? (
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </span>
              ) : (
                <ProfileAvatar
                  name={item.actor.displayName ?? item.actor.username}
                  avatarUrl={item.actor.avatarUrl}
                  size="sm"
                />
              )}
              <span className="min-w-0">
                <span className="text-zinc-900 dark:text-zinc-50">
                  {!isSystemNotification(item.type) && (
                    <span className="font-medium">
                      {item.actor.displayName ?? item.actor.username}{" "}
                    </span>
                  )}
                  {getNotificationText(item.type)}
                </span>
                {item.post && (
                  <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {item.post.title}
                  </span>
                )}
                <span className="mt-0.5 block text-xs text-zinc-400 dark:text-zinc-500">
                  {formatRelativeTime(item.createdAt)}
                </span>
              </span>
            </Link>
            <button
              type="button"
              aria-label="알림 삭제"
              onClick={() => handleDelete(item.id)}
              className="mr-2 shrink-0 rounded-md p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoading}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {isLoading ? "불러오는 중..." : "더 보기"}
          </button>
        </div>
      )}
    </div>
  );
}
