"use client";

import { useActionState } from "react";
import type { AuthActionState } from "@/features/auth/actions";
import { buttonPrimaryFullClass, errorTextClass, successTextClass } from "@/lib/ui-classes";

type AuthFormProps = {
  action: (prevState: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  submitLabel: string;
  children: React.ReactNode;
  next?: string;
};

export function AuthForm({ action, submitLabel, children, next }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  if (state.success) {
    return <p className={successTextClass}>{state.message}</p>;
  }

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {children}
      {state.error && <p className={errorTextClass}>{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonPrimaryFullClass}>
        {pending ? "처리 중..." : submitLabel}
      </button>
    </form>
  );
}
