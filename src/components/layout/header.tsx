"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LoginModal } from "@/components/auth/login-modal";
import { SignUpModal } from "@/components/auth/signup-modal";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signOut } from "@/features/auth/actions";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { SearchBar } from "@/features/search/components/search-bar";

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
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const showUsername = displayName !== username;

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
        aria-label={`${displayName} 프로필`}
        aria-expanded={isOpen}
        title={displayName}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white ring-2 ring-zinc-200 transition hover:ring-zinc-300 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-700 dark:hover:ring-zinc-600"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- S3 공개 URL 아바타
          <img
            src={avatarUrl}
            alt={`${displayName} 프로필 이미지`}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          getProfileInitial(displayName)
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- S3 공개 URL 아바타
                <img
                  src={avatarUrl}
                  alt={`${displayName} 프로필 이미지`}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">
                  {getProfileInitial(displayName)}
                </span>
              )}
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
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              내 프로필
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                관리자
              </Link>
            )}

            <form action={signOut}>
              <button
                type="submit"
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

type HeaderProps = {
  user: HeaderUser | null;
  unreadNotificationCount?: number;
};

export function Header({ user, unreadNotificationCount = 0 }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState<AuthModal>(null);
  const [authNext, setAuthNext] = useState<string | undefined>();

  function openLoginModal(next?: string) {
    setIsMenuOpen(false);
    setAuthNext(next);
    setAuthModal("login");
  }

  function openSignUpModal(next?: string) {
    setIsMenuOpen(false);
    setAuthNext(next);
    setAuthModal("signup");
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex h-15 items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
          <Link href="/" className="inline-flex shrink-0 items-center" aria-label="Heavy Jungle 홈">
            <Image
              src="/logo/logo.png"
              alt="Heavy Jungle"
              width={1019}
              height={210}
              className="h-8 w-auto sm:h-9 dark:hidden"
              priority
            />
            <Image
              src="/logo/logo_dark.png"
              alt="Heavy Jungle"
              width={1019}
              height={210}
              className="hidden h-8 w-auto sm:h-9 dark:block"
              priority
            />
          </Link>

          <SearchBar className="mx-3 min-w-0 max-w-xl flex-1 sm:mx-4" />

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <AuthButtons
              className="hidden md:flex"
              user={user}
              onLoginClick={openLoginModal}
              onSignUpClick={() => openSignUpModal()}
            />

            <button
              type="button"
              aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-zinc-100 md:hidden dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <span className="sr-only">메뉴</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden="true"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
            {user && <NotificationBell initialUnreadCount={unreadNotificationCount} />}
            {user && (
              <Link
                href="/write"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-500 px-2 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
            )}
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

        {isMenuOpen && (
          <div className="border-t border-zinc-200 px-4 py-4 md:hidden dark:border-zinc-800">
            <AuthButtons
              className="flex-col [&_button]:w-full"
              user={user}
              onLoginClick={openLoginModal}
              onSignUpClick={() => openSignUpModal()}
            />
          </div>
        )}
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
