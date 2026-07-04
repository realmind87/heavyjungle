"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type MobileBottomNavProps = {
  username: string | null;
};

function AllPostsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h10" />
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

function NoticeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l18-5v12L3 14v-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.6 16.8a3 3 0 0 1-5.8-1.6" />
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

/** 모바일 전용 하단 탭바 — 전체글 / 팔로우 / 공지사항 / 프로필 */
export function MobileBottomNav({ username }: MobileBottomNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const feed = searchParams.get("feed");

  const hideNav =
    pathname.startsWith("/write") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.includes("/edit");

  if (hideNav) return null;

  const isHome = pathname === "/";
  const items = [
    {
      key: "all",
      label: "전체글",
      href: "/",
      active: isHome && feed !== "following",
      icon: <AllPostsIcon />,
    },
    {
      key: "following",
      label: "팔로우 글",
      href: "/?feed=following",
      active: isHome && feed === "following",
      icon: <FollowingIcon />,
    },
    {
      key: "notices",
      label: "공지사항",
      href: "/notices",
      active: pathname.startsWith("/notices"),
      icon: <NoticeIcon />,
    },
    {
      key: "profile",
      label: "프로필",
      href: username ? `/u/${username}` : "/login",
      active: username ? pathname === `/u/${username}` : pathname.startsWith("/login"),
      icon: <ProfileIcon />,
    },
  ];

  function navItem(item: (typeof items)[number]) {
    return (
      <Link
        href={item.href}
        aria-current={item.active ? "page" : undefined}
        className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition ${
          item.active
            ? "text-zinc-900 dark:text-zinc-50"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        {item.icon}
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
