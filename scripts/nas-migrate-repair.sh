#!/bin/sh
# 부분 적용된 마이그레이션 정리 후 nas-migrate.sh 재실행용
# users 등은 있지만 posts 없거나, migrate 가 중간에 끊긴 경우
# Usage: ./scripts/nas-migrate-repair.sh

set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${NAS_COMPOSE_FILE:-docker-compose.nas.yml}"
MIGRATION_0000_HASH="7b4d58f8fb7ee3f7ffeafb4a16e06244e02291a20698d39710fc7e9f3c6d8897"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

echo "==> heavyjungle: reset partial schema (users/posts 등), keep items + drizzle journal 0000"
echo "    실제 유저/글 데이터가 있으면 중단하세요 (Ctrl+C)"
sleep 3

sudo docker compose -f "$COMPOSE_FILE" stop app 2>/dev/null || true

sudo docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" heavyjungle-postgres \
  psql -v ON_ERROR_STOP=1 -U postgres -d heavyjungle <<EOSQL
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

echo "==> Repair done. Run: ./scripts/nas-migrate.sh"
