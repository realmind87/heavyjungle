"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, verifyTotpLogin, type AuthActionState } from "@/features/auth/actions";
import { buttonPrimaryFullClass, errorTextClass, inputClass, labelClass } from "@/lib/ui-classes";

type LoginFormProps = {
  next?: string;
};

export function LoginForm({ next }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signIn, {} as AuthActionState);
  const [totpState, totpAction, totpPending] = useActionState(verifyTotpLogin, {} as AuthActionState);

  if (state.needsTotp && state.pendingLoginToken) {
    return (
      <form action={totpAction} className="space-y-4">
        <input type="hidden" name="pendingLoginToken" value={state.pendingLoginToken} />
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          인증 앱의 6자리 코드를 입력해 주세요.
        </p>
        <label className="block">
          <span className={labelClass}>인증 코드</span>
          <input
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            className={inputClass}
          />
        </label>
        {totpState.error && <p className={errorTextClass}>{totpState.error}</p>}
        <button type="submit" disabled={totpPending} className={buttonPrimaryFullClass}>
          {totpPending ? "확인 중..." : "로그인 완료"}
        </button>
      </form>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <label className="block">
        <span className={labelClass}>이메일 또는 아이디</span>
        <input name="login" type="text" required autoComplete="username" className={inputClass} />
      </label>
      <label className="block">
        <span className={labelClass}>비밀번호</span>
        <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </label>
      {state.error && <p className={errorTextClass}>{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonPrimaryFullClass}>
        {pending ? "로그인 중..." : "로그인"}
      </button>
      {state.error?.includes("이메일 인증") && (
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/login/resend-verification" className="underline">
            인증 메일 다시 받기
          </Link>
        </p>
      )}
    </form>
  );
}
