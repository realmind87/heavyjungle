"use client";

/** 비밀번호 변경 폼 — 성공 시 다른 기기 세션 무효화 안내 */
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { changePassword, type ProfileActionState } from "@/features/profile/actions";

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
        <span className="text-sm font-medium">현재 비밀번호</span>
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full border px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">새 비밀번호</span>
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="mt-1 w-full border px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">새 비밀번호 확인</span>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="mt-1 w-full border px-3 py-2 text-sm"
        />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && state.message && (
        <p className="text-sm text-green-600">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full border bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
