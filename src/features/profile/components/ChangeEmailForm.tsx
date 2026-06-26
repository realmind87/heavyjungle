"use client";

/** 이메일 변경 폼 — 현재 비밀번호로 본인 확인 (인증 메일 발송은 다음 단계) */
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { changeEmail, type ProfileActionState } from "@/features/profile/actions";
import {
  buttonPrimaryFullClass,
  errorTextClass,
  inputClass,
  labelMediumClass,
  mutedTextClass,
  successTextClass,
} from "@/lib/ui-classes";

type ChangeEmailFormProps = {
  username: string;
  variant: "modal" | "page";
  currentEmail: string;
};

export function ChangeEmailForm({ username, variant, currentEmail }: ChangeEmailFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(changeEmail, {} as ProfileActionState);

  useEffect(() => {
    if (!state.success) return;

    if (variant === "modal") {
      router.back();
    } else {
      router.replace(`/u/${username}`);
    }
    router.refresh();
  }, [state.success, variant, username, router]);

  return (
    <form action={formAction} className="space-y-4">
      <p className={mutedTextClass}>
        현재 이메일: <span className="font-medium text-zinc-700 dark:text-zinc-300">{currentEmail}</span>
      </p>

      <label className="block">
        <span className={labelMediumClass}>새 이메일</span>
        <input
          name="newEmail"
          type="email"
          autoComplete="email"
          required
          className={`mt-1 ${inputClass}`}
        />
      </label>

      <label className="block">
        <span className={labelMediumClass}>현재 비밀번호</span>
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={`mt-1 ${inputClass}`}
        />
      </label>

      {state.error && <p className={errorTextClass}>{state.error}</p>}
      {state.message && !state.error && <p className={successTextClass}>{state.message}</p>}

      <button type="submit" disabled={pending} className={buttonPrimaryFullClass}>
        {pending ? "변경 중..." : "이메일 변경"}
      </button>
    </form>
  );
}
