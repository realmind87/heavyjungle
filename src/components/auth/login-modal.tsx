"use client";

import { useActionState, useEffect, useId } from "react";
import { AuthRecoveryLinks } from "@/components/auth/auth-recovery-links";
import { signIn, type AuthActionState } from "@/features/auth/actions";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp?: () => void;
  next?: string;
};

export function LoginModal({ isOpen, onClose, onSwitchToSignUp, next }: LoginModalProps) {
  const titleId = useId();
  const [state, formAction, pending] = useActionState(signIn, {} as AuthActionState);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="로그인 창 닫기"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-[500px] w-[500px] max-w-full flex-col rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <h2 id={titleId} className="text-center text-[22px] font-bold text-zinc-900 dark:text-zinc-50">
          로그인
        </h2>

        <form action={formAction} className="mt-8 flex flex-1 flex-col">
          {next && <input type="hidden" name="next" value={next} />}
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">이메일 또는 아이디</span>
              <input
                type="text"
                name="login"
                autoComplete="username"
                required
                placeholder="이메일 또는 아이디"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-400 dark:focus:ring-zinc-700"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">비밀번호</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                placeholder="비밀번호를 입력하세요"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-400 dark:focus:ring-zinc-700"
              />
            </label>
          </div>

          {state.error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{state.error}</p>}

          <AuthRecoveryLinks className="mt-3" onNavigate={onClose} />

          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {pending ? "로그인 중..." : "로그인"}
          </button>

          {onSwitchToSignUp && (
            <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              계정이 없으신가요?{" "}
              <button type="button" onClick={onSwitchToSignUp} className="text-zinc-900 underline dark:text-zinc-100">
                회원가입
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
