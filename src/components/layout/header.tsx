"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoginModal } from "@/components/auth/login-modal";
import { SignUpModal } from "@/components/auth/signup-modal";
import { signOut } from "@/features/auth/actions";
import { useThemeMode } from "@/hooks/use-theme-mode";

type HeaderUser = {
  username: string;
};

type AuthModal = "login" | "signup" | null;

function getProfileInitial(username: string) {
  return username.charAt(0).toUpperCase();
}

function ProfileMenu({ username }: { username: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isDark, setThemeMode } = useThemeMode();

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

  const selectTheme = useCallback(
    (mode: "light" | "dark") => {
      setThemeMode(mode);
    },
    [setThemeMode],
  );

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={`${username} 프로필`}
        aria-expanded={isOpen}
        title={username}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white ring-2 ring-zinc-200 transition hover:ring-zinc-300 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-700 dark:hover:ring-zinc-600"
      >
        {getProfileInitial(username)}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{username}</p>
          </div>

          <div className="p-2">
            <Link
              href={`/u/${username}`}
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              내 프로필
            </Link>

            <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {isDark ? "다크 모드" : "라이트 모드"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isDark}
                aria-label="다크 모드 토글"
                onClick={() => selectTheme(isDark ? "light" : "dark")}
                className={`relative h-7 w-12 shrink-0 rounded-full ${
                  isDark ? "bg-zinc-700" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${
                    isDark ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

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
};

export function Header({ user }: HeaderProps) {
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
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-xl"
          >
            배포는기도다
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
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

            {user && <ProfileMenu username={user.username} />}
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
