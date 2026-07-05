"use client";

import { useState } from "react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, passwordChecks } from "@/lib/validators/password";
import { inputClass, labelClass } from "@/lib/ui-classes";

type SignUpPasswordFieldsProps = {
  inputClassName?: string;
  labelClassName?: string;
};

export function SignUpPasswordFields({
  inputClassName = inputClass,
  labelClassName = labelClass,
}: SignUpPasswordFieldsProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const showMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <>
      <label className="block">
        <span className={`flex items-center gap-1.5 ${labelClassName.replace(/\bblock\b/g, "").trim()}`}>
          비밀번호
          <InfoTooltip ariaLabel="비밀번호 입력 안내">
            <p className="font-medium text-zinc-800 dark:text-zinc-100">비밀번호 규칙</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>
                {PASSWORD_MIN_LENGTH}자 이상, {PASSWORD_MAX_LENGTH}자 이하로 입력해 주세요.
              </li>
              <li>영문을 포함해 주세요.</li>
              <li>숫자를 포함해 주세요.</li>
              <li>비밀번호 확인란에 동일하게 입력해 주세요.</li>
            </ul>
          </InfoTooltip>
        </span>

        <input
          type="password"
          name="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="비밀번호를 입력하세요"
          className={inputClassName}
        />
        <ul
          className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400"
          aria-live="polite"
        >
          {passwordChecks.map((check) => {
            const passed = check.test(password);
            return (
              <li
                key={check.id}
                className={passed ? "text-green-600 dark:text-green-400" : undefined}
              >
                {passed ? "✓" : "○"} {check.label}
              </li>
            );
          })}
        </ul>
      </label>

      <label className="block">
        <span className={labelClassName}>비밀번호 확인</span>
        <input
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="비밀번호를 다시 입력하세요"
          className={inputClassName}
          aria-invalid={showMismatch}
        />
      </label>

      {showMismatch && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          비밀번호가 일치하지 않습니다.
        </p>
      )}
    </>
  );
}
