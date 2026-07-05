import { z } from "zod";
import { passwordSchema } from "@/lib/validators/password";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "아이디는 3자 이상이어야 합니다.")
  .max(30, "아이디는 30자 이하여야 합니다.")
  .regex(/^[a-zA-Z0-9_]+$/, "아이디는 영문, 숫자, 밑줄만 사용할 수 있습니다.");

const emailSchema = z.email("올바른 이메일 형식이 아닙니다.");

export { emailSchema, passwordSchema };

export const signUpSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력하세요."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  /** 이메일 또는 아이디 */
  login: z.string().trim().min(1, "이메일 또는 아이디를 입력하세요."),
  password: z.string().min(1, "비밀번호를 입력하세요."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

export const findUsernameSchema = z.object({
  email: emailSchema,
});

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "유효하지 않은 링크입니다."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력하세요."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });
