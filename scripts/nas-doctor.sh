#!/bin/sh
# NAS 진단 — DB 비밀번호, 테이블, 헬스체크
# Usage: ./scripts/nas-doctor.sh

set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${NAS_COMPOSE_FILE:-docker-compose.nas.yml}"
HEALTH_URL="${NAS_HEALTH_URL:-http://localhost:3000/api/health}"

fail=0

warn() {
  echo "!! $*" >&2
  fail=1
}

ok() {
  echo "ok $*"
}

echo "==> heavyjungle NAS doctor ($ROOT)"
echo ""

if [ ! -f .env ]; then
  warn ".env 없음 — cp .env.nas.example .env 후 POSTGRES_PASSWORD 설정"
else
  ok ".env 존재"
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

echo ""
echo "==> Postgres 연결 (컨테이너 내부)"
if sudo docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" heavyjungle-postgres \
  psql -U postgres -d heavyjungle -c "SELECT 1;" >/dev/null 2>&1; then
  ok "postgres 비밀번호 일치"
else
  warn "postgres 비밀번호 불일치 — .env POSTGRES_PASSWORD 가 DB 볼륨 생성 시 값과 달라요"
  echo "   해결: 기존 비밀번호로 .env 수정, 또는"
  echo "   sudo docker exec heavyjungle-postgres psql -U postgres -c \"ALTER USER postgres WITH PASSWORD '새비번';\""
  echo "   후 .env 도 동일하게 맞추고 app 재시작"
fi

echo ""
echo "==> 필수 테이블"
for table in users sessions posts; do
  exists="$(sudo docker exec heavyjungle-postgres \
    psql -U postgres -d heavyjungle -tAc "SELECT to_regclass('public.${table}') IS NOT NULL" 2>/dev/null || echo false)"
  if [ "$exists" = "true" ]; then
    ok "public.${table}"
  else
    warn "public.${table} 없음 — ./scripts/nas-migrate.sh 실행 필요"
  fi
done

echo ""
echo "==> App 헬스체크: $HEALTH_URL"
if curl -sf "$HEALTH_URL"; then
  echo ""
  ok "health endpoint"
else
  warn "health endpoint 실패"
  echo ""
  echo "==> app 로그 (마지막 40줄)"
  sudo docker compose -f "$COMPOSE_FILE" logs --tail=40 app || true
fi

echo ""
echo "==> 홈 페이지 (localhost)"
home_status="$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ || echo 000)"
if [ "$home_status" = "200" ]; then
  ok "GET / → $home_status"
else
  warn "GET / → $home_status (500이면 마이그레이션 미실행 가능성 큼)"
fi

echo ""
if [ "$fail" -eq 0 ]; then
  echo "==> 진단 통과"
else
  echo "==> 문제 발견 — 위 메시지 참고"
  exit 1
fi
