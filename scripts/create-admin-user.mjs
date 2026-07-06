/**
 * 관리자 계정 생성/승격 스크립트
 *
 * 사용법:
 *   node scripts/create-admin-user.mjs <username> [email]
 *
 * 예:
 *   node scripts/create-admin-user.mjs stansfield0125
 */
import { randomBytes } from "node:crypto";
import { config } from "dotenv";
import { hash } from "@node-rs/argon2";
import postgres from "postgres";

config();

const username = process.argv[2]?.trim();
const emailArg = process.argv[3]?.trim();

if (!username) {
  console.error("사용법: node scripts/create-admin-user.mjs <username> [email]");
  process.exit(1);
}

if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
  console.error("아이디는 3~30자의 영문, 숫자, 밑줄만 사용할 수 있습니다.");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL이 설정되어 있지 않습니다.");
  process.exit(1);
}

const email = emailArg ?? `${username}@heavyjungle.local`;
const tempPassword = randomBytes(12).toString("base64url");

const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const sql = postgres(databaseUrl);

try {
  const existing = await sql`
    SELECT id, username, role
    FROM users
    WHERE username = ${username} OR email = ${email}
    LIMIT 1
  `;

  if (existing.length > 0) {
    const user = existing[0];
    if (user.role !== "admin") {
      await sql`UPDATE users SET role = 'admin' WHERE id = ${user.id}`;
      console.log(`기존 계정 "${user.username}"을(를) 관리자(role=admin)로 승격했습니다.`);
    } else {
      console.log(`계정 "${user.username}"은(는) 이미 관리자입니다.`);
    }
    console.log(`로그인: ${user.username}`);
    console.log("비밀번호는 기존 비밀번호를 사용하세요.");
    process.exit(0);
  }

  const passwordHash = await hash(tempPassword, ARGON2_OPTIONS);

  const [created] = await sql`
    INSERT INTO users (username, email, password_hash, role, email_verified_at)
    VALUES (${username}, ${email}, ${passwordHash}, 'admin', NOW())
    RETURNING username, email
  `;

  console.log("관리자 계정을 생성했습니다.");
  console.log(`아이디: ${created.username}`);
  console.log(`이메일: ${created.email}`);
  console.log(`임시 비밀번호: ${tempPassword}`);
  console.log("로그인 후 비밀번호를 변경하세요.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await sql.end();
}
