/**
 * 프로필·계정 설정 입력 검증 (Zod v4).
 */
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다.")
  .max(128, "비밀번호는 128자 이하여야 합니다.");

export const updateProfileSchema = z.object({
  displayName: z.string().trim().max(30, "표시 이름은 30자 이하여야 합니다."),
  bio: z.string().trim().max(300, "소개는 300자 이하여야 합니다."),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력하세요."),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력하세요."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "새 비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const changeEmailSchema = z.object({
  newEmail: z.email("올바른 이메일 형식이 아닙니다."),
  currentPassword: z.string().min(1, "현재 비밀번호를 입력하세요."),
});

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;

export const userPostsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type UserPostsQuery = z.infer<typeof userPostsQuerySchema>;
