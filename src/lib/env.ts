/**
 * 환경변수 검증 모듈.
 * dotenv로 .env를 로드한 뒤 Zod로 검증하고, 실패 시 프로세스를 종료합니다.
 */
import { config } from "dotenv";
import { z } from "zod";

config();

/** Docker Compose `${VAR:-}` passes "" when unset — treat as missing for optional fields */
function optionalNonEmptyString() {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(1).optional(),
  );
}

function optionalUrl() {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url().optional(),
  );
}

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
  /** 비밀번호 재설정 링크 등 절대 URL 생성용 */
  APP_URL: z.string().url().default("http://localhost:3000"),
  /** Resend API — 없으면 development에서 콘솔로 출력 */
  RESEND_API_KEY: optionalNonEmptyString(),
  EMAIL_FROM: optionalNonEmptyString(),
  /** 관리자 아이디 (쉼표 구분) — DB role과 병행 */
  ADMIN_USERNAMES: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return [] as string[];
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }),
  /** Umami 통계 API (서버 전용, 선택) */
  UMAMI_API_URL: optionalUrl(),
  /** Umami Cloud 등 정적 API 키 — 셀프호스팅은 비워두고 로그인 방식 사용 */
  UMAMI_API_TOKEN: optionalNonEmptyString(),
  UMAMI_WEBSITE_ID: optionalNonEmptyString(),
  UMAMI_USERNAME: optionalNonEmptyString(),
  UMAMI_PASSWORD: optionalNonEmptyString(),
  /** Google Safe Browsing Lookup API — 외부 링크 악성 검사 (서버 전용, 선택) */
  GOOGLE_SAFE_BROWSING_API_KEY: optionalNonEmptyString(),
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

/** 서버 대시보드 Umami API — UMAMI_* 없으면 null */
export function getUmamiServerConfig(): {
  apiUrl: string;
  websiteId: string;
  apiToken?: string;
  username?: string;
  password?: string;
} | null {
  const {
    UMAMI_API_URL,
    UMAMI_API_TOKEN,
    UMAMI_WEBSITE_ID,
    UMAMI_USERNAME,
    UMAMI_PASSWORD,
  } = env;

  if (!UMAMI_API_URL || !UMAMI_WEBSITE_ID) return null;

  const hasLogin = Boolean(UMAMI_USERNAME && UMAMI_PASSWORD);
  const hasToken = Boolean(UMAMI_API_TOKEN);

  if (!hasLogin && !hasToken) return null;

  return {
    apiUrl: UMAMI_API_URL.replace(/\/$/, ""),
    websiteId: UMAMI_WEBSITE_ID,
    ...(UMAMI_API_TOKEN ? { apiToken: UMAMI_API_TOKEN } : {}),
    ...(hasLogin ? { username: UMAMI_USERNAME, password: UMAMI_PASSWORD } : {}),
  };
}
