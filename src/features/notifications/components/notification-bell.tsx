"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { markAllNotificationsRead } from "@/features/notifications/actions";
import {
  getNotificationHref,
  getNotificationText,
  isSystemNotification,
} from "@/features/notifications/display";
import type { NotificationItem } from "@/features/notifications/types";
import { formatRelativeTime } from "@/lib/time";

type NotificationBellProps = {
  initialUnreadCount: number;
};

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function NotificationBell({ initialUnreadCount }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    let cancelled = false;

    async function refreshUnreadCount() {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { unreadCount: number };
        if (!cancelled) setUnreadCount(data.unreadCount);
      } catch {
        // 네트워크 오류는 조용히 무시 — 다음 주기에 재시도
      }
    }

    const intervalId = window.setInterval(refreshUnreadCount, 30_000);
    window.addEventListener("focus", refreshUnreadCount);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshUnreadCount);
    };
  }, []);

  async function handleToggle() {
    const next = !isOpen;
    setIsOpen(next);

    if (next) {
      if (items === null) setIsLoading(true);
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { items: NotificationItem[]; unreadCount: number };
          setItems(data.items);
        }
      } finally {
        setIsLoading(false);
      }

      if (unreadCount > 0) {
        setUnreadCount(0);
        await markAllNotificationsRead();
      }
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label="알림"
        aria-expanded={isOpen}
        onClick={handleToggle}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 inline-flex h-2 w-2 rounded-full bg-red-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 max-h-96 w-80 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">알림</p>
          </div>

          {isLoading && (
            <p className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              불러오는 중...
            </p>
          )}

          {!isLoading && items && items.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              알림이 없습니다.
            </p>
          )}

          {!isLoading && items && items.length > 0 && (
            <ul>
              {items.map((item) => (
                <li key={item.id} className="border-t border-zinc-100 first:border-t-0 dark:border-zinc-800">
                  <Link
                    href={getNotificationHref(item)}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-start gap-2.5 px-4 py-3 text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                      item.isRead ? "" : "bg-zinc-50 dark:bg-zinc-800/60"
                    }`}
                  >
                    {isSystemNotification(item.type) ? (
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                        <SystemIcon />
                      </span>
                    ) : item.actor.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- S3 공개 URL 아바타
                      <img
                        src={item.actor.avatarUrl}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">
                        {(item.actor.displayName ?? item.actor.username).charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="text-zinc-900 dark:text-zinc-50">
                        {!isSystemNotification(item.type) && (
                          <>
                            <span className="font-medium">
                              {item.actor.displayName ?? item.actor.username}
                            </span>{" "}
                          </>
                        )}
                        {getNotificationText(item.type)}
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-zinc-200 dark:border-zinc-700">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-center text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              모든 알림 보기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
