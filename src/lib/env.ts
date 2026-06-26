/**
 * 환경변수 검증 모듈.
 * dotenv로 .env를 로드한 뒤 Zod로 검증하고, 실패 시 프로세스를 종료합니다.
 */
import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  DATABASE_URL: z.url(),
  REDIS_URL: z.string().min(1),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1).default("us-east-1"),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  /** 브라우저가 객체를 읽을 공개 베이스 URL (Cloudflare 터널/리버스 프록시 주소) */
  S3_PUBLIC_URL: z.url(),
  /** MinIO는 path-style 필수 — "true" | "false" */
  S3_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    console.error(`\n❌ Invalid environment variables:\n${details}\n`);
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
