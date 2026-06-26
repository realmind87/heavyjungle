#!/bin/sh
# NAS DB 마이그레이션 — /volume1/docker/heavyjungle 에서 실행
# Usage: ./scripts/nas-migrate.sh

set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${NAS_COMPOSE_FILE:-docker-compose.nas.yml}"
EXPECTED_MIGRATIONS=7

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
  sudo docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" heavyjungle-postgres \
    psql -v ON_ERROR_STOP=1 -U postgres -d heavyjungle "$@"
}

echo "==> Bootstrapping legacy initdb (items only, no drizzle journal)"
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

echo "==> Applied migrations so far:"
psql_as_postgres -c "SELECT id, left(hash, 12) AS hash_prefix, created_at FROM drizzle.__drizzle_migrations ORDER BY id;" \
  2>/dev/null || echo "(none yet)"

echo ""
echo "==> Stopping app (DB lock 방지)"
sudo docker compose -f "$COMPOSE_FILE" stop app 2>/dev/null || true

echo ""
echo "==> Running Drizzle migrations (첫 실행은 npm ci 때문에 5~10분 걸릴 수 있음)"
set +e
sudo docker compose -f "$COMPOSE_FILE" --profile migrate run --rm -T migrate
migrate_status=$?
set -e

echo ""
if [ "$migrate_status" -ne 0 ]; then
  echo "==> drizzle-kit migrate failed (exit $migrate_status)" >&2
  echo "   부분 적용 상태면: ./scripts/nas-migrate-repair.sh 후 다시 실행" >&2
  sudo docker compose -f "$COMPOSE_FILE" start app 2>/dev/null || true
  exit "$migrate_status"
fi

echo "==> drizzle-kit migrate finished (exit 0)"

echo ""
echo "==> Applied migrations after run:"
psql_as_postgres -c "SELECT id, left(hash, 12) AS hash_prefix, created_at FROM drizzle.__drizzle_migrations ORDER BY id;"

migration_count="$(psql_as_postgres -tAc "SELECT count(*) FROM drizzle.__drizzle_migrations;" 2>/dev/null || echo 0)"
echo "==> Migration count: $migration_count (expected $EXPECTED_MIGRATIONS)"

echo ""
echo "==> Verifying posts table"
if ! psql_as_postgres -tAc "SELECT to_regclass('public.posts') IS NOT NULL" | grep -q true; then
  echo "==> public.posts is still missing" >&2
  echo "   ./scripts/nas-migrate-repair.sh 실행 후 다시 시도하세요." >&2
  sudo docker compose -f "$COMPOSE_FILE" start app 2>/dev/null || true
  exit 1
fi

echo ""
echo "==> Starting app"
sudo docker compose -f "$COMPOSE_FILE" start app

echo "==> Migrations complete."
