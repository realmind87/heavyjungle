"use client";

import { useActionState } from "react";
import type { AuthActionState } from "@/features/auth/actions";

type AuthFormProps = {
  action: (prevState: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  submitLabel: string;
  children: React.ReactNode;
  next?: string;
};

export function AuthForm({ action, submitLabel, children, next }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {children}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="w-full border bg-zinc-900 px-4 py-2 text-white disabled:opacity-50">
        {pending ? "처리 중..." : submitLabel}
      </button>
    </form>
  );
}
