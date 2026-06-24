# Deploy and Pray

Next.js App Router 기반의 풀스택 웹 애플리케이션입니다. Server Component를 기본으로 하며, 대용량 데이터 처리와 CRUD 작업에 최적화된 개발 스택을 사용합니다.

## 주요 기능

- **Server Components** — 서버에서 데이터 fetch 및 렌더링
- **CRUD API** — REST 엔드포인트 + Server Actions
- **커서 페이지네이션** — 대량 데이터 목록 조회에 적합
- **배치 처리** — 트랜잭션 기반 bulk insert (최대 500건)
- **Redis 캐시** — 조회 성능 향상, CUD 시 캐시 무효화
- **타입 안전성** — TypeScript + Zod 스키마 검증

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4 |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Validation | Zod |
| Client State | TanStack Query |
| Infra | Docker Compose |

## 프로젝트 구조

```
src/
├── app/                  # App Router 페이지 및 API
│   ├── api/              # REST API (/items, /health)
│   ├── items/            # CRUD 데모 페이지
│   └── page.tsx          # 홈 (Server Component)
├── actions/              # Server Actions
├── components/           # React 컴포넌트
├── db/                   # Drizzle 스키마, 마이그레이션, DB 연결
├── hooks/                # React Query 훅
├── lib/                  # 캐시, 페이지네이션, Zod 검증
└── repositories/         # 데이터 접근 레이어 (CRUD, 배치)
```

## 사전 요구사항

- Node.js 18+
- Docker Desktop (PostgreSQL, Redis 사용 시)

## 시작하기

### 1. 저장소 클론 및 의존성 설치

```bash
git clone https://github.com/realmind87/heavyjungle.git
cd heavyjungle
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

### 3. DB 및 Redis 실행 (CRUD 기능 사용 시)

```bash
npm run docker:up   # Postgres + Redis 컨테이너 시작
npm run db:push     # 스키마 DB 반영
```

### 4. 개발 서버 실행

```bash
npm run dev
```

| URL | 설명 |
|-----|------|
| http://localhost:3000 | 홈 |
| http://localhost:3000/items | CRUD 데모 |
| http://localhost:3000/api/health | DB/Redis 헬스체크 |

> 홈(`/`)만 확인할 경우 Docker 없이 `npm run dev`만 실행해도 됩니다.  
> CRUD(`/items`)는 PostgreSQL과 Redis가 필요합니다.

## npm 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 (Turbopack) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run docker:up` | 로컬 Docker (Postgres + Redis) 시작 |
| `npm run docker:down` | 로컬 Docker 종료 |
| `npm run docker:nas:up` | NAS Docker 스택 시작 |
| `npm run docker:nas:cloudflare` | NAS + Cloudflare Tunnel 시작 |
| `npm run docker:nas:down` | NAS Docker 스택 종료 |
| `npm run docker:nas:logs` | NAS 앱 로그 확인 |
| `npm run db:generate` | 마이그레이션 파일 생성 |
| `npm run db:push` | 스키마 DB 반영 |
| `npm run db:migrate` | 마이그레이션 실행 |
| `npm run db:studio` | Drizzle Studio (DB GUI) |

## Synology NAS 배포 (DS918+)

Cloudflare Tunnel로 `https://heavyjungle.com` 에 서비스합니다.

```bash
mkdir -p /volume1/docker
cd /volume1/docker
git clone https://github.com/realmind87/heavyjungle.git
cd /volume1/docker/heavyjungle

cp .env.nas.example .env
# POSTGRES_PASSWORD, CLOUDFLARE_TUNNEL_TOKEN 설정

docker compose -f docker-compose.nas.yml --profile cloudflare up -d --build
```

| URL | 설명 |
|-----|------|
| https://heavyjungle.com | 프로덕션 (Cloudflare) |
| http://NAS_IP:3000 | NAS 내부 테스트 |

## API

### Items

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/items?cursor=&limit=` | 목록 조회 (커서 페이지네이션) |
| `POST` | `/api/items` | 단건 생성 |
| `GET` | `/api/items/:id` | 단건 조회 |
| `PATCH` | `/api/items/:id` | 수정 |
| `DELETE` | `/api/items/:id` | 삭제 |

### Health

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/health` | PostgreSQL, Redis 연결 상태 |

## 아키텍처

```
Client (React Query)
    ↓ fetch
API Routes / Server Actions
    ↓
Repository Layer  ←→  Redis Cache
    ↓
Drizzle ORM → PostgreSQL
```

- **Repository 패턴** — 비즈니스 로직과 DB 접근 분리
- **커서 페이지네이션** — `id` 기반으로 offset 방식 대비 대용량 목록에 유리
- **커넥션 풀** — `DB_POOL_MAX` 등 환경 변수로 튜닝 가능
- **Server Actions** — 폼 기반 mutation 및 `revalidatePath` 지원

## 환경 변수

`.env.example` 참고:

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 연결 URL | `postgresql://postgres:postgres@localhost:5432/heavyjungle` |
| `REDIS_URL` | Redis 연결 URL | `redis://localhost:6379` |
| `DB_POOL_MAX` | DB 커넥션 풀 최대 크기 | `20` |
| `CACHE_TTL_SECONDS` | 캐시 TTL (초) | `300` |

## 라이선스

Private
