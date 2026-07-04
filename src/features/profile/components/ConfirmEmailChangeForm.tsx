"use client";

import { useActionState } from "react";
import {
  confirmEmailChange,
  type ConfirmEmailChangeState,
} from "@/features/profile/actions";
import { buttonPrimaryFullClass, errorTextClass } from "@/lib/ui-classes";

type ConfirmEmailChangeFormProps = {
  token: string;
};

export function ConfirmEmailChangeForm({ token }: ConfirmEmailChangeFormProps) {
  const [state, formAction, pending] = useActionState(
    confirmEmailChange,
    {} as ConfirmEmailChangeState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.error && <p className={`text-center ${errorTextClass}`}>{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonPrimaryFullClass}>
        {pending ? "확인 중..." : "이메일 변경 확인"}
      </button>
    </form>
  );
}
