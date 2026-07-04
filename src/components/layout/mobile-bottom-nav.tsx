"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type MobileBottomNavProps = {
  username: string | null;
  initialUnreadCount?: number;
};

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
    </svg>
  );
}

function FollowingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

type NavItem = {
  key: string;
  label: string;
  href: string;
  active: boolean;
  icon: React.ReactNode;
  badge?: number;
  ariaLabel?: string;
};

/** 모바일 전용 하단 탭바 — 홈 / 팔로우 / 등록 / 알림 / MY */
export function MobileBottomNav({ username, initialUnreadCount = 0 }: MobileBottomNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const feed = searchParams.get("feed");
  const isLoggedIn = !!username;
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    async function refreshUnreadCount() {
      try {
        const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { unreadCount: number };
        if (!cancelled) setUnreadCount(data.unreadCount);
      } catch {
        // ignore
      }
    }

    const onFocus = () => void refreshUnreadCount();
    const timer = window.setInterval(refreshUnreadCount, 30_000);

    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [isLoggedIn]);

  const hideNav =
    pathname.startsWith("/write") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.includes("/edit");

  if (hideNav) return null;

  const isHome = pathname === "/";
  const profileHref = username ? `/u/${username}` : "/login";
  const profileActive = username ? pathname.startsWith(`/u/${username}`) : pathname.startsWith("/login");

  const items: NavItem[] = [
    {
      key: "home",
      label: "홈",
      href: "/",
      active: isHome && feed !== "following",
      icon: <HomeIcon />,
    },
    {
      key: "following",
      label: "팔로우",
      href: isLoggedIn ? "/?feed=following" : "/login?next=/?feed=following",
      active: isHome && feed === "following",
      icon: <FollowingIcon />,
    },
    {
      key: "notifications",
      label: "알림",
      href: isLoggedIn ? "/notifications" : "/login?next=/notifications",
      active: pathname.startsWith("/notifications"),
      icon: <BellIcon />,
      badge: unreadCount,
      ariaLabel: unreadCount > 0 ? `알림, ${unreadCount}개 안 읽음` : "알림",
    },
    {
      key: "my",
      label: "MY",
      href: profileHref,
      active: profileActive,
      icon: <ProfileIcon />,
    },
  ];

  function navItem(item: NavItem) {
    return (
      <Link
        href={item.href}
        aria-current={item.active ? "page" : undefined}
        aria-label={item.ariaLabel}
        className={`relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition ${
          item.active
            ? "text-zinc-900 dark:text-zinc-50"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        <span className="relative inline-flex">
          {item.icon}
          {item.badge != null && item.badge > 0 && (
            <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </span>
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <nav
      aria-label="모바일 하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-950/95"
    >
      <ul className="grid grid-cols-5 items-center">
        <li>{navItem(items[0])}</li>
        <li>{navItem(items[1])}</li>
        <li className="flex justify-center">
          <Link
            href="/write"
            aria-label="등록"
            className="flex flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium text-zinc-500 transition dark:text-zinc-400"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
              <PlusIcon />
            </span>
            <span>등록</span>
          </Link>
        </li>
        <li>{navItem(items[2])}</li>
        <li>{navItem(items[3])}</li>
      </ul>
    </nav>
  );
}
