"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import { LoginModal } from "@/components/auth/login-modal";
import { SignUpModal } from "@/components/auth/signup-modal";
import { MobileHeaderMenu } from "@/components/layout/mobile-header-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signOut } from "@/features/auth/actions";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { SearchBar } from "@/features/search/components/search-bar";
import { useDismissOnEscape } from "@/hooks/use-a11y";

type HeaderUser = {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
};

type AuthModal = "login" | "signup" | null;

function getProfileInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

function ProfileMenu({
  username,
  displayName,
  avatarUrl,
  isAdmin,
}: {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
}) {
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const showUsername = displayName !== username;

  useDismissOnEscape(isOpen, () => setIsOpen(false));

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

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={`${displayName} 프로필 메뉴`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        title={displayName}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-sm font-semibold text-white ring-2 ring-zinc-200 transition hover:ring-zinc-300 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-700 dark:hover:ring-zinc-600"
      >
        {avatarUrl ? (
          <ProfileAvatar name={displayName} avatarUrl={avatarUrl} size="sm" />
        ) : (
          getProfileInitial(displayName)
        )}
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={`${displayName} 프로필 메뉴`}
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <ProfileAvatar name={displayName} avatarUrl={avatarUrl} size="2xs" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{displayName}</p>
                {showUsername && (
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">@{username}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-2">
            <Link
              href={`/u/${username}`}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              내 프로필
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                관리자
              </Link>
            )}

            <form action={signOut}>
              <button
                type="submit"
                role="menuitem"
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AuthButtons({
  className = "",
  user,
  onLoginClick,
  onSignUpClick,
}: {
  className?: string;
  user: HeaderUser | null;
  onLoginClick: (next?: string) => void;
  onSignUpClick: () => void;
}) {
  if (user) return null;

  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      <button
        type="button"
        onClick={() => onLoginClick()}
        className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:px-4"
      >
        로그인
      </button>
      <button
        type="button"
        onClick={onSignUpClick}
        className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 sm:px-4"
      >
        회원가입
      </button>
    </div>
  );
}

function LogoLink({ heightClass, className = "" }: { heightClass: string; className?: string }) {
  return (
    <Link href="/" className={`inline-flex shrink-0 items-center ${className}`} aria-label="Heavy Jungle 홈">
      <Image
        src="/logo/logo.png"
        alt="Heavy Jungle"
        width={1019}
        height={210}
        className={`${heightClass} w-auto dark:hidden`}
        priority
      />
      <Image
        src="/logo/logo_dark.png"
        alt="Heavy Jungle"
        width={1019}
        height={210}
        className={`hidden ${heightClass} w-auto dark:block`}
        priority
      />
    </Link>
  );
}

function WriteButton() {
  return (
    <Link
      href="/write"
      aria-label="글쓰기"
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-500 text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
      >
        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
      </svg>
    </Link>
  );
}

type HeaderProps = {
  user: HeaderUser | null;
  unreadNotificationCount?: number;
};

export function Header({ user, unreadNotificationCount = 0 }: HeaderProps) {
  const [authModal, setAuthModal] = useState<AuthModal>(null);
  const [authNext, setAuthNext] = useState<string | undefined>();

  function openLoginModal(next?: string) {
    setAuthNext(next);
    setAuthModal("login");
  }

  function openSignUpModal(next?: string) {
    setAuthNext(next);
    setAuthModal("signup");
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        {/* 데스크톱: 로고 · 검색 · 액션 한 줄 */}
        <div className="mx-auto hidden h-15 items-center justify-between gap-4 px-6 md:flex">
          <LogoLink heightClass="h-9" />

          <SearchBar className="mx-4 min-w-0 max-w-xl flex-1" />

          <div className="flex shrink-0 items-center gap-3">
            <ThemeToggle />
            <AuthButtons
              user={user}
              onLoginClick={openLoginModal}
              onSignUpClick={() => openSignUpModal()}
            />
            {user && <NotificationBell initialUnreadCount={unreadNotificationCount} />}
            {user && <WriteButton />}
            {user && (
              <ProfileMenu
                username={user.username}
                displayName={user.displayName}
                avatarUrl={user.avatarUrl}
                isAdmin={user.isAdmin}
              />
            )}
          </div>
        </div>

        {/* 모바일: 로고 가운데 정렬 + 아래 줄에 전체폭 검색 */}
        <div className="px-4 pb-2 md:hidden">
          <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex items-center gap-1 justify-self-start">
              <Suspense fallback={<div className="h-10 w-10 shrink-0 md:hidden" aria-hidden="true" />}>
                <MobileHeaderMenu
                  isLoggedIn={!!user}
                  onLoginClick={openLoginModal}
                />
              </Suspense>
            </div>

            <LogoLink heightClass="h-7" className="justify-self-center" />

            <div className="flex items-center gap-1 justify-self-end">
              {user ? (
                <NotificationBell initialUnreadCount={unreadNotificationCount} />
              ) : (
                <button
                  type="button"
                  onClick={() => openLoginModal()}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  로그인
                </button>
              )}
            </div>
          </div>

          <SearchBar className="w-full" />
        </div>
      </header>

      <LoginModal
        isOpen={authModal === "login"}
        onClose={() => setAuthModal(null)}
        onSwitchToSignUp={() => setAuthModal("signup")}
        next={authNext}
      />
      <SignUpModal
        isOpen={authModal === "signup"}
        onClose={() => setAuthModal(null)}
        onSwitchToLogin={() => setAuthModal("login")}
        next={authNext}
      />
    </>
  );
}
