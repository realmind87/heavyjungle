/**
 * DB 콘텐츠에서 구 사이트명(배포는기도다)을 Heavy Jungle로 치환합니다.
 *
 * 사용법:
 *   node scripts/fix-legacy-brand-in-content.mjs          # 적용
 *   node scripts/fix-legacy-brand-in-content.mjs --dry-run  # 미리보기만
 *
 * NAS: ./scripts/nas-migrate.sh (0023_fix_legacy_brand_content.sql) 로도 동일 적용됩니다.
 */
import { config } from "dotenv";
import postgres from "postgres";

config();

const dryRun = process.argv.includes("--dry-run");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL이 설정되어 있지 않습니다.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });

const LEGACY_PATTERN = "%배포는%기도%";
const LEGACY_PATTERN_COMPACT = "%배포는기도%";

function replaceLegacy(text) {
  return text.replaceAll("배포는 기도다", "Heavy Jungle").replaceAll("배포는기도다", "Heavy Jungle");
}

try {
  const posts = await sql`
    SELECT id, title, content
    FROM posts
    WHERE is_deleted = false
      AND (
        title ILIKE ${LEGACY_PATTERN}
        OR content ILIKE ${LEGACY_PATTERN}
        OR title ILIKE ${LEGACY_PATTERN_COMPACT}
        OR content ILIKE ${LEGACY_PATTERN_COMPACT}
      )
  `;

  const comments = await sql`
    SELECT id, content
    FROM comments
    WHERE is_deleted = false
      AND (
        content ILIKE ${LEGACY_PATTERN}
        OR content ILIKE ${LEGACY_PATTERN_COMPACT}
      )
  `;

  const users = await sql`
    SELECT id, username, bio
    FROM users
    WHERE bio IS NOT NULL
      AND (
        bio ILIKE ${LEGACY_PATTERN}
        OR bio ILIKE ${LEGACY_PATTERN_COMPACT}
      )
  `;

  if (posts.length === 0 && comments.length === 0 && users.length === 0) {
    console.log("구 브랜드명(배포는기도다)이 포함된 콘텐츠가 없습니다.");
    process.exit(0);
  }

  console.log(
    `대상: 글 ${posts.length}건, 댓글 ${comments.length}건, 프로필 소개 ${users.length}건`,
  );

  for (const post of posts) {
    console.log(`- post ${post.id}: ${post.title}`);
    if (dryRun) continue;
    await sql`
      UPDATE posts
      SET
        title = ${replaceLegacy(post.title)},
        content = ${replaceLegacy(post.content)},
        updated_at = NOW()
      WHERE id = ${post.id}
    `;
  }

  for (const comment of comments) {
    console.log(`- comment ${comment.id}`);
    if (dryRun) continue;
    await sql`
      UPDATE comments
      SET content = ${replaceLegacy(comment.content)}, updated_at = NOW()
      WHERE id = ${comment.id}
    `;
  }

  for (const user of users) {
    console.log(`- user @${user.username}`);
    if (dryRun) continue;
    await sql`
      UPDATE users
      SET bio = ${replaceLegacy(user.bio)}, updated_at = NOW()
      WHERE id = ${user.id}
    `;
  }

  console.log(dryRun ? "dry-run 완료 (변경 없음)" : "치환 완료");
} finally {
  await sql.end();
}
