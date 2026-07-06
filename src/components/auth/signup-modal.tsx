"use client";

import { useActionState, useId, useRef } from "react";
import { SignUpPasswordFields } from "@/components/auth/signup-password-fields";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { signUp, type AuthActionState } from "@/features/auth/actions";
import { useModalA11y } from "@/hooks/use-a11y";

const modalInputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-400 dark:focus:ring-zinc-700";

const modalLabelClass = "mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

type SignUpModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
  next?: string;
};

export function SignUpModal({ isOpen, onClose, onSwitchToLogin, next }: SignUpModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [state, formAction, pending] = useActionState(signUp, {} as AuthActionState);

  useModalA11y({ open: isOpen, onClose, dialogRef });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="회원가입 창 닫기"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[90vh] w-[500px] max-w-full flex-col overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
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
          회원가입
        </h2>

        <form action={formAction} className="mt-8 flex flex-1 flex-col">
          {next && <input type="hidden" name="next" value={next} />}
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                아이디
                <InfoTooltip ariaLabel="아이디 입력 안내">
                  <p className="font-medium text-zinc-800 dark:text-zinc-100">아이디 규칙</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    <li>최소 4자 이상, 최대 20자 이하로 입력해 주세요.</li>
                    <li>영문 소문자, 숫자, 특수문자(_)만 사용할 수 있습니다.</li>
                    <li>특수문자(_)는 최대 1개까지 사용할 수 있습니다.</li>
                  </ul>
                </InfoTooltip>
              </span>
              <input
                type="text"
                name="username"
                autoComplete="username"
                required
                placeholder="아이디"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-400 dark:focus:ring-zinc-700"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">이메일</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="이메일"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-400 dark:focus:ring-zinc-700"
              />
            </label>

            <SignUpPasswordFields inputClassName={modalInputClass} labelClassName={modalLabelClass} />
          </div>

          {state.success ? (
            <p className="mt-6 text-sm text-green-600 dark:text-green-400">{state.message}</p>
          ) : (
            <>
              {state.error && (
                <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {pending ? "가입 중..." : "회원가입"}
              </button>
            </>
          )}

          {onSwitchToLogin && (
            <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              이미 계정이 있으신가요?{" "}
              <button type="button" onClick={onSwitchToLogin} className="text-zinc-900 underline dark:text-zinc-100">
                로그인
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
