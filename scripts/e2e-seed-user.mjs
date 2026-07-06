/**
 * E2E 테스트용 고정 계정 생성/비밀번호 동기화
 *
 * Usage: node scripts/e2e-seed-user.mjs
 *
 * Env:
 *   E2E_USERNAME (default: e2e_user)
 *   E2E_PASSWORD (default: e2e-test-password)
 *   E2E_EMAIL    (default: e2e_user@heavyjungle.test)
 */
import { config } from "dotenv";
import { hash } from "@node-rs/argon2";
import postgres from "postgres";

config();

const username = process.env.E2E_USERNAME?.trim() || "e2e_user";
const password = process.env.E2E_PASSWORD?.trim() || "e2e-test-password";
const email = process.env.E2E_EMAIL?.trim() || "e2e_user@heavyjungle.test";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL이 설정되어 있지 않습니다.");
  process.exit(1);
}

if (password.length < 8) {
  console.error("E2E_PASSWORD는 8자 이상이어야 합니다.");
  process.exit(1);
}

const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const sql = postgres(databaseUrl);

try {
  const passwordHash = await hash(password, ARGON2_OPTIONS);

  const existing = await sql`
    SELECT id, username
    FROM users
    WHERE username = ${username} OR email = ${email}
    LIMIT 1
  `;

  if (existing.length > 0) {
    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}, email = ${email}, username = ${username}, email_verified_at = NOW()
      WHERE id = ${existing[0].id}
    `;
    console.log(`E2E 계정 비밀번호를 동기화했습니다: ${username}`);
  } else {
    await sql`
      INSERT INTO users (username, email, password_hash, role, email_verified_at)
      VALUES (${username}, ${email}, ${passwordHash}, 'user', NOW())
    `;
    console.log(`E2E 계정을 생성했습니다: ${username}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await sql.end();
}
