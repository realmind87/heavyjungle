#!/bin/sh
# NAS — 기존 사용자를 DB role=admin 으로 승격
# Usage: ./scripts/nas-promote-admin.sh <username>
#
# 예: ./scripts/nas-promote-admin.sh stansfield0125

set -eu

USERNAME="${1:-}"
if [ -z "$USERNAME" ]; then
  echo "사용법: ./scripts/nas-promote-admin.sh <username>"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
CONTAINER="${POSTGRES_CONTAINER:-heavyjungle-postgres}"

psql_as_postgres() {
  sudo docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" "$CONTAINER" \
    psql -v ON_ERROR_STOP=1 -U postgres -d heavyjungle "$@"
}

echo "==> role 컬럼 확인 (마이그레이션 0009 필요)"
if [ "$(psql_as_postgres -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role');")" != "t" ]; then
  echo "users.role 컬럼이 없습니다. 먼저 ./scripts/nas-migrate.sh 를 실행하세요." >&2
  exit 1
fi

echo "==> 승격 전:"
psql_as_postgres -c "SELECT username, role FROM users WHERE username = '$USERNAME';"

updated="$(psql_as_postgres -tAc "UPDATE users SET role = 'admin' WHERE username = '$USERNAME' RETURNING id;")"
if [ -z "$updated" ]; then
  echo "==> 사용자 '$USERNAME' 을(를) 찾을 수 없습니다. 먼저 https://heavyjungle.com 에서 회원가입하세요." >&2
  exit 1
fi

echo "==> 승격 완료:"
psql_as_postgres -c "SELECT username, role, email FROM users WHERE username = '$USERNAME';"
echo ""
echo "https://heavyjungle.com/login 에서 로그인 후 /admin 또는 프로필 메뉴 → 관리자"
