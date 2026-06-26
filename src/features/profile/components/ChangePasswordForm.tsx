"use client";

/** 비밀번호 변경 폼 — 성공 시 다른 기기 세션 무효화 안내 */
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { changePassword, type ProfileActionState } from "@/features/profile/actions";
import {
  buttonPrimaryFullClass,
  errorTextClass,
  inputClass,
  labelMediumClass,
  successTextClass,
} from "@/lib/ui-classes";

type ChangePasswordFormProps = {
  username: string;
  variant: "modal" | "page";
};

export function ChangePasswordForm({ username, variant }: ChangePasswordFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(changePassword, {} as ProfileActionState);

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

      <label className="block">
        <span className={labelMediumClass}>새 비밀번호</span>
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={`mt-1 ${inputClass}`}
        />
      </label>

      <label className="block">
        <span className={labelMediumClass}>새 비밀번호 확인</span>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={`mt-1 ${inputClass}`}
        />
      </label>

      {state.error && <p className={errorTextClass}>{state.error}</p>}
      {state.success && state.message && <p className={successTextClass}>{state.message}</p>}

      <button type="submit" disabled={pending} className={buttonPrimaryFullClass}>
        {pending ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
