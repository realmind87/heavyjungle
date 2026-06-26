#!/bin/sh
# NAS DB 마이그레이션 — /volume1/docker/heavyjungle 에서 실행
# Usage: ./scripts/nas-migrate.sh

set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${NAS_COMPOSE_FILE:-docker-compose.nas.yml}"
EXPECTED_MIGRATIONS=7
JOURNAL_FILE="$ROOT/src/db/migrations/meta/_journal.json"

# docker-entrypoint-initdb.d 로 0000(items)만 적용된 레거시 볼륨용
MIGRATION_0000_HASH="7b4d58f8fb7ee3f7ffeafb4a16e06244e02291a20698d39710fc7e9f3c6d8897"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

psql_as_postgres() {
  sudo docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" heavyjungle-postgres \
    psql -v ON_ERROR_STOP=1 -U postgres -d heavyjungle "$@"
}

migration_count() {
  psql_as_postgres -tAc "SELECT count(*) FROM drizzle.__drizzle_migrations;" 2>/dev/null || echo 0
}

table_exists() {
  psql_as_postgres -tAc "SELECT to_regclass('public.$1') IS NOT NULL;" 2>/dev/null || echo false
}

repair_partial_schema() {
  echo "==> Repair: users/posts 등 부분 스키마 정리 (items + drizzle 0000 유지)"
  psql_as_postgres <<EOSQL
DROP TABLE IF EXISTS "likes" CASCADE;
DROP TABLE IF EXISTS "votes" CASCADE;
DROP TABLE IF EXISTS "comments" CASCADE;
DROP TABLE IF EXISTS "posts" CASCADE;
DROP TABLE IF EXISTS "boards" CASCADE;
DROP TABLE IF EXISTS "memberships" CASCADE;
DROP TABLE IF EXISTS "communities" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TYPE IF EXISTS "public"."membership_role";
DELETE FROM drizzle.__drizzle_migrations
WHERE hash <> '${MIGRATION_0000_HASH}';
EOSQL

  if [ "$(table_exists users)" = "true" ]; then
    echo "==> repair failed: public.users still exists" >&2
    exit 1
  fi
}

bootstrap_legacy_0000() {
  psql_as_postgres <<EOSQL
CREATE SCHEMA IF NOT EXISTS drizzle;
CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT '${MIGRATION_0000_HASH}', (extract(epoch from now()) * 1000)::bigint
WHERE to_regclass('public.items') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = '${MIGRATION_0000_HASH}'
  );
EOSQL
}

run_drizzle_migrate() {
  MIGRATE_LOG="/tmp/heavyjungle-migrate-$$.log"
  set +e
  sudo docker compose -f "$COMPOSE_FILE" --profile migrate run --rm -T migrate 2>&1 | tee "$MIGRATE_LOG"
  migrate_status=$?
  set -e

  if [ "$migrate_status" -ne 0 ]; then
    echo "==> drizzle-kit migrate failed (exit $migrate_status)" >&2
    tail -40 "$MIGRATE_LOG" >&2 || true
    rm -f "$MIGRATE_LOG"
    return "$migrate_status"
  fi

  rm -f "$MIGRATE_LOG"
  return 0
}

if [ ! -f "$JOURNAL_FILE" ]; then
  echo "==> missing $JOURNAL_FILE — git pull origin main 필요" >&2
  exit 1
fi

JOURNAL_ENTRIES="$(grep -c '"tag":' "$JOURNAL_FILE" || true)"
SQL_FILES="$(find "$ROOT/src/db/migrations" -maxdepth 1 -name '*.sql' | wc -l | tr -d ' ')"

echo "==> Migration files on disk: journal=$JOURNAL_ENTRIES tags, $SQL_FILES sql files"
if [ "$JOURNAL_ENTRIES" -lt "$EXPECTED_MIGRATIONS" ]; then
  echo "==> journal 항목이 $EXPECTED_MIGRATIONS 개 미만입니다. NAS에서 git pull origin main 후 다시 실행하세요." >&2
  exit 1
fi

echo "==> Journal tags:"
grep '"tag":' "$JOURNAL_FILE" | sed 's/^/   /'

bootstrap_legacy_0000

echo ""
echo "==> Applied migrations before run:"
psql_as_postgres -c "SELECT id, left(hash, 12) AS hash_prefix, created_at FROM drizzle.__drizzle_migrations ORDER BY id;" \
  2>/dev/null || echo "(none yet)"

count_before="$(migration_count)"
users_before="$(table_exists users)"
posts_before="$(table_exists posts)"

echo ""
echo "==> DB state: migrations=$count_before users=$users_before posts=$posts_before"

if [ "$count_before" -lt "$EXPECTED_MIGRATIONS" ] && { [ "$users_before" = "true" ] || [ "$posts_before" = "true" ]; }; then
  echo "==> 부분 적용 감지 — repair 후 migrate 진행"
  repair_partial_schema
fi

echo ""
echo "==> Stopping app (DB lock 방지)"
sudo docker compose -f "$COMPOSE_FILE" stop app 2>/dev/null || true

echo ""
echo "==> Running Drizzle migrations (첫 실행은 npm ci 때문에 5~10분 걸릴 수 있음)"
if ! run_drizzle_migrate; then
  echo "==> 수동 repair: ./scripts/nas-migrate-repair.sh 후 재시도" >&2
  sudo docker compose -f "$COMPOSE_FILE" start app 2>/dev/null || true
  exit 1
fi

count_after="$(migration_count)"
if [ "$count_after" -lt "$EXPECTED_MIGRATIONS" ]; then
  echo ""
  echo "==> drizzle-kit 은 성공했지만 journal 이 $count_after/$EXPECTED_MIGRATIONS 만 기록됨" >&2
  echo "==> repair 후 1회 재시도합니다..." >&2
  repair_partial_schema
  if ! run_drizzle_migrate; then
    sudo docker compose -f "$COMPOSE_FILE" start app 2>/dev/null || true
    exit 1
  fi
  count_after="$(migration_count)"
fi

echo ""
echo "==> Applied migrations after run:"
psql_as_postgres -c "SELECT id, left(hash, 12) AS hash_prefix, created_at FROM drizzle.__drizzle_migrations ORDER BY id;"
echo "==> Migration count: $count_after (expected $EXPECTED_MIGRATIONS)"

if [ "$count_after" -lt "$EXPECTED_MIGRATIONS" ]; then
  echo "==> 여전히 $count_after 개 — 컨테이너에서 journal 확인:" >&2
  sudo docker compose -f "$COMPOSE_FILE" --profile migrate run --rm -T migrate \
    sh -c 'grep tag src/db/migrations/meta/_journal.json' >&2 || true
  sudo docker compose -f "$COMPOSE_FILE" start app 2>/dev/null || true
  exit 1
fi

echo ""
echo "==> Verifying posts table"
if [ "$(table_exists posts)" != "true" ]; then
  echo "==> public.posts is still missing" >&2
  sudo docker compose -f "$COMPOSE_FILE" start app 2>/dev/null || true
  exit 1
fi

echo ""
echo "==> Starting app"
sudo docker compose -f "$COMPOSE_FILE" start app

echo "==> Migrations complete."
