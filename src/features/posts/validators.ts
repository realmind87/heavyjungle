import { z } from "zod";

export const postCategorySchema = z.enum(["general", "notice"]);
export type PostCategory = z.infer<typeof postCategorySchema>;

export const createPostFormSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요.").max(200, "제목은 200자 이하여야 합니다."),
  content: z.string().trim().min(1, "내용을 입력하세요."),
  category: postCategorySchema.default("general"),
});

export type CreatePostFormInput = z.infer<typeof createPostFormSchema>;

export const updatePostSchema = z.object({
  postId: z.uuid("유효한 글이 필요합니다."),
  title: z.string().trim().min(1, "제목을 입력하세요.").max(200, "제목은 200자 이하여야 합니다."),
  content: z.string().trim().min(1, "내용을 입력하세요."),
  category: postCategorySchema.default("general"),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const postListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(["latest", "popular", "oldest"]).default("latest"),
});

export type PostListQuery = z.infer<typeof postListQuerySchema>;
