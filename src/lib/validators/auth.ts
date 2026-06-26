import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "아이디는 3자 이상이어야 합니다.")
  .max(30, "아이디는 30자 이하여야 합니다.")
  .regex(/^[a-zA-Z0-9_]+$/, "아이디는 영문, 숫자, 밑줄만 사용할 수 있습니다.");

const emailSchema = z.email("올바른 이메일 형식이 아닙니다.");

const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다.")
  .max(128, "비밀번호는 128자 이하여야 합니다.");

export const signUpSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  /** 이메일 또는 아이디 */
  login: z.string().trim().min(1, "이메일 또는 아이디를 입력하세요."),
  password: z.string().min(1, "비밀번호를 입력하세요."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
