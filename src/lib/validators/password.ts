import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordCheck = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const passwordChecks: PasswordCheck[] = [
  {
    id: "length",
    label: `${PASSWORD_MIN_LENGTH}자 이상`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "letter",
    label: "영문 포함",
    test: (password) => /[a-zA-Z]/.test(password),
  },
  {
    id: "number",
    label: "숫자 포함",
    test: (password) => /\d/.test(password),
  },
];

export function isPasswordStrong(password: string): boolean {
  return (
    password.length <= PASSWORD_MAX_LENGTH && passwordChecks.every((check) => check.test(password))
  );
}

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`)
  .max(PASSWORD_MAX_LENGTH, `비밀번호는 ${PASSWORD_MAX_LENGTH}자 이하여야 합니다.`)
  .regex(/[a-zA-Z]/, "비밀번호에 영문을 포함해 주세요.")
  .regex(/\d/, "비밀번호에 숫자를 포함해 주세요.");
