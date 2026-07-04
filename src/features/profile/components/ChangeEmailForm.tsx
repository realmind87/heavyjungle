"use client";

/** 이메일 변경 폼 — 현재 비밀번호 확인 후 새 주소로 인증 메일 발송 */
import { useActionState } from "react";
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

export function ChangeEmailForm({ currentEmail }: ChangeEmailFormProps) {
  const [state, formAction, pending] = useActionState(changeEmail, {} as ProfileActionState);

  return (
    <form action={formAction} className="space-y-4">
      <p className={mutedTextClass}>
        현재 이메일:{" "}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{currentEmail}</span>
      </p>
      <p className={mutedTextClass}>
        새 이메일로 인증 메일이 발송됩니다. 메일함의 링크를 확인해야 변경이 완료됩니다.
      </p>

      <label className="block">
        <span className={labelMediumClass}>새 이메일</span>
        <input
          name="newEmail"
          type="email"
          autoComplete="email"
          required
          disabled={state.success}
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
          disabled={state.success}
          className={`mt-1 ${inputClass}`}
        />
      </label>

      {state.error && <p className={errorTextClass}>{state.error}</p>}
      {state.message && !state.error && <p className={successTextClass}>{state.message}</p>}

      {!state.success && (
        <button type="submit" disabled={pending} className={buttonPrimaryFullClass}>
          {pending ? "발송 중..." : "인증 메일 보내기"}
        </button>
      )}
    </form>
  );
}
