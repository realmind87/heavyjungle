#!/bin/sh
# NAS DB 마이그레이션 — /volume1/docker/heavyjungle 에서 실행
# Usage: ./scripts/nas-migrate.sh

set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${NAS_COMPOSE_FILE:-docker-compose.nas.yml}"

# docker-entrypoint-initdb.d 로 0000(items)만 적용된 레거시 볼륨용
MIGRATION_0000_HASH="7b4d58f8fb7ee3f7ffeafb4a16e06244e02291a20698d39710fc7e9f3c6d8897"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

echo "==> Bootstrapping legacy initdb (items only, no drizzle journal)"
sudo docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" heavyjungle-postgres \
  psql -v ON_ERROR_STOP=1 -U postgres -d heavyjungle <<EOSQL
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
sudo docker exec heavyjungle-postgres \
  psql -U postgres -d heavyjungle -c "SELECT id, left(hash, 12) AS hash_prefix, created_at FROM drizzle.__drizzle_migrations ORDER BY id;" \
  2>/dev/null || echo "(none yet)"

echo ""
echo "==> Running Drizzle migrations (첫 실행은 npm ci 때문에 5~10분 걸릴 수 있음)"
sudo docker compose -f "$COMPOSE_FILE" --profile migrate run --rm migrate

echo ""
echo "==> Applied migrations after run:"
sudo docker exec heavyjungle-postgres \
  psql -U postgres -d heavyjungle -c "SELECT id, left(hash, 12) AS hash_prefix, created_at FROM drizzle.__drizzle_migrations ORDER BY id;"

echo ""
echo "==> Verifying posts table"
if ! sudo docker exec heavyjungle-postgres \
  psql -U postgres -d heavyjungle -tAc "SELECT to_regclass('public.posts') IS NOT NULL" \
  | grep -q true; then
  echo "==> Migration finished but public.posts is missing" >&2
  echo "   ./scripts/nas-doctor.sh 로 상태 확인 후 app 로그를 확인하세요." >&2
  exit 1
fi

echo "==> Migrations complete. app 재시작: sudo docker compose -f $COMPOSE_FILE restart app"
