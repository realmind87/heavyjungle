# 배포는기도다 (heavyjungle)

Next.js App Router 기반 커뮤니티 웹 애플리케이션입니다. Server Component를 기본으로 하며, 자체 세션 인증·게시글·댓글·프로필·NAS Docker 배포까지 포함합니다.

## 서비스 URL

| 환경 | URL | 비고 |
|------|-----|------|
| **프로덕션** | [https://heavyjungle.com](https://heavyjungle.com) | Synology NAS + Docker + Cloudflare Tunnel |
| 로컬 개발 | http://localhost:3000 | `npm run dev` |

프로덕션 사이트명: **배포는기도다**

## 구현된 기능

### 인증 · 계정

- 회원가입 / 로그인 / 로그아웃 (Server Actions + httpOnly 세션 쿠키)
- 헤더 로그인·회원가입 모달, `?next=` 리다이렉트 지원
- **아이디 찾기** — 가입 이메일로 아이디 안내 메일 발송 (`/login/find-username`)
- **비밀번호 찾기** — 이메일 재설정 링크 발송, 1시간 유효 토큰 (`/login/forgot-password` → `/reset-password`)
- 프로필 비밀번호·이메일 변경 (`/u/[username]/settings/...`)
- **관리자 권한** — `users.role` (`user` \| `admin`) + `ADMIN_USERNAMES` 환경 변수 병행
- 관리자 계정 생성 스크립트 (`node scripts/create-admin-user.mjs <username>`)

### 게시글

- 글 작성 / 수정 / 삭제 (soft delete) — 작성 취소 버튼
- **리치 텍스트 에디터** (HTML sanitize)
  - 굵게, 기울임, 취소선, 링크, 글자 크기·색상, 정렬
  - **이미지** 업로드 (최대 100MB) — 선택 시 X 삭제, 좌·가운데·우 정렬
  - **동영상** 업로드 (MP4/WebM/MOV, 최대 1GB) — 업로드 진행률·취소, 커버 프레임 드래그 선택
  - **YouTube** embed 삽입
- 홈 최신글 목록 + 커서 페이지네이션
- 썸네일 카드 — 이미지 / 동영상(포스터·플레이스홀더) / YouTube 썸네일
- 글 상세 — 조회수, 좋아요, 댓글 수, 정렬·미디어 스타일 반영
- 작성자 아바타·아이디 메타 표시

### 댓글

- 댓글 작성 / 삭제 (soft delete)
- 1단계 대댓글 (중첩 스레드)
- 리치 텍스트 댓글 (이미지·링크) — 툴바 하단 등록·취소 버튼
- 에러 토스트 피드백

### 관리자 (`/admin`)

- 관리자 전용 페이지 (로그인 + 권한 검사)
- 탭 UI: **최신 글** / **최신 댓글** / **사용자**
- 글·댓글 삭제, 사용자 role 변경 (`user` ↔ `admin`)
- 프로필 메뉴에 관리자 링크 (관리자만 표시)

### 좋아요 · 조회수

- 글 좋아요 토글 (`useOptimistic`)
- 조회수 증가 API (`PostViewCount`)

### 프로필

- 공개 프로필 페이지 (`/u/[username]`)
- 표시 이름·소개·아바타 수정
- MinIO(S3 호환) 아바타 업로드
- 헤더 프로필 이미지 (`avatarUrl`) 표시
- 내가 쓴 글 목록

### UI · UX

- 라이트 / 다크 모드 (프로필 메뉴 토글)
- 공통 UI 클래스 (`src/lib/ui-classes.ts`)
- 반응형 헤더 (모바일 메뉴, 글쓰기 버튼)

### 인프라 · 개발 DX

- Docker Compose — PostgreSQL, Redis, MinIO
- Drizzle ORM 마이그레이션 (`0009`: `users.role` enum)
- `npm run dev` 시 로컬 DB 자동 기동 (`scripts/ensure-local-db.sh`)
- NAS 배포 스크립트 (`scripts/nas-deploy.sh`)
- MinIO 공개 읽기: `uploads/avatars`, `uploads/comments`, `uploads/posts`

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4 |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Storage | MinIO (S3 호환) |
| Auth | Argon2id, 자체 세션 (DB + httpOnly 쿠키) |
| Validation | Zod v4 |
| Client State | TanStack Query |
| Email | Resend API (선택, dev는 콘솔 출력) |
| Infra | Docker Compose, Cloudflare Tunnel |

## 프로젝트 구조

```
src/
├── app/                      # App Router 페이지·API
│   ├── api/                  # REST (/health, /items, /posts/...)
│   ├── login/                # 로그인, 아이디/비밀번호 찾기
│   ├── posts/[id]/           # 글 상세·수정
│   ├── write/                # 글 작성
│   ├── u/[username]/         # 프로필·설정
│   └── page.tsx              # 홈 (최신글)
├── components/               # 공통 UI (header, auth 모달 등)
├── features/                 # 도메인별 actions, queries, components
│   ├── auth/
│   ├── posts/
│   ├── comments/
│   ├── likes/
│   ├── profile/
│   └── admin/
├── server/                   # DB, auth, email
│   ├── db/schema/
│   ├── auth/
│   └── email/
├── lib/                      # env, validators, cursor, storage-url
└── db/migrations/            # SQL 마이그레이션
```

## 사전 요구사항

- Node.js 18+
- Docker Desktop (로컬 DB·Redis·MinIO)

## 로컬 개발

### 1. 클론 및 설치

```bash
git clone https://github.com/realmind87/heavyjungle.git
cd heavyjungle
npm install
```

### 2. 환경 변수

```bash
cp .env.example .env
```

### 3. 개발 서버 실행

```bash
npm run dev
```

`predev` 훅이 Docker(Postgres/Redis/MinIO) 상태를 확인하고, 꺼져 있으면 자동으로 올립니다.

| URL | 설명 |
|-----|------|
| http://localhost:3000 | 홈 (최신글) |
| http://localhost:3000/write | 글 작성 (로그인 필요) |
| http://localhost:3000/login | 로그인 |
| http://localhost:3000/items | CRUD 데모 |
| http://localhost:9001 | MinIO 콘솔 (minioadmin / minioadmin) |

수동으로 DB만 올릴 때:

```bash
npm run docker:up
npm run db:migrate
```

## 주요 라우트

| 경로 | 설명 |
|------|------|
| `/` | 최신글 목록 |
| `/write` | 글 작성 |
| `/posts/[id]` | 글 상세 |
| `/posts/[id]/edit` | 글 수정 |
| `/login` | 로그인 |
| `/login/find-username` | 아이디 찾기 |
| `/login/forgot-password` | 비밀번호 찾기 |
| `/reset-password?token=` | 비밀번호 재설정 |
| `/signup` | 회원가입 |
| `/admin` | 관리자 (글·댓글·사용자 관리) |
| `/u/[username]` | 프로필 |
| `/u/[username]/edit` | 프로필 수정 |
| `/settings` | 설정 (리다이렉트) |

## npm 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 (DB 자동 확인 포함) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint |
| `npm run docker:up` | 로컬 Docker 시작 |
| `npm run docker:down` | 로컬 Docker 종료 |
| `npm run db:migrate` | 마이그레이션 적용 |
| `npm run db:generate` | 마이그레이션 파일 생성 |
| `npm run db:studio` | Drizzle Studio |
| `npm run deploy:nas` | NAS 배포 스크립트 |
| `npm run docker:nas:cloudflare` | NAS + Cloudflare Tunnel |
| `node scripts/create-admin-user.mjs <username>` | 관리자 계정 생성·승격 |

## Synology NAS 배포

Cloudflare Tunnel로 **[https://heavyjungle.com](https://heavyjungle.com)** 에 서비스합니다.

### 최초 설정

```bash
mkdir -p /volume1/docker
cd /volume1/docker
git clone https://github.com/realmind87/heavyjungle.git
cd heavyjungle

cp .env.nas.example .env
# POSTGRES_PASSWORD, CLOUDFLARE_TUNNEL_TOKEN, APP_URL, RESEND_API_KEY 등 설정

docker compose -f docker-compose.nas.yml --profile cloudflare up -d --build
```

### 업데이트 배포

**Mac (코드 푸시)**

```bash
git add .
git commit -m "your message"
git push origin main
```

**NAS (SSH / DSM 터미널)**

```bash
cd /volume1/docker/heavyjungle
git pull origin main
chmod +x scripts/nas-deploy.sh
./scripts/nas-deploy.sh
```

또는 수동:

```bash
cd /volume1/docker/heavyjungle
git pull origin main
sudo docker compose -f docker-compose.nas.yml --profile cloudflare up -d --build
npm run db:migrate   # 새 마이그레이션 있을 때
```

## 환경 변수

`.env.example` 참고:

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | PostgreSQL 연결 URL |
| `REDIS_URL` | Redis 연결 URL |
| `S3_*` | MinIO / S3 스토리지 (아바타 등) |
| `APP_URL` | 비밀번호 재설정 링크용 앱 URL |
| `RESEND_API_KEY` | 이메일 발송 (Resend) |
| `EMAIL_FROM` | 발신 주소 |
| `ADMIN_USERNAMES` | 관리자 아이디 (쉼표 구분, DB `role`과 병행) |
| `NEXT_PUBLIC_S3_PUBLIC_URL` | 클라이언트용 S3 공개 URL (에디터 미리보기) |

개발 환경에서 `RESEND_API_KEY`가 없으면 아이디/비밀번호 찾기 메일 내용이 **터미널 콘솔**에 출력됩니다.

## API

### Posts

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/posts` | 글 목록 |
| `POST` | `/api/posts/[id]/like` | 좋아요 토글 |
| `POST` | `/api/posts/[id]/view` | 조회수 증가 |

### Items (데모)

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/items?cursor=&limit=` | 목록 (커서 페이지네이션) |
| `POST` | `/api/items` | 생성 |
| `GET/PATCH/DELETE` | `/api/items/:id` | 조회·수정·삭제 |

### Health

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/health` | PostgreSQL, Redis 상태 |

## 아키텍처

```
Browser
  ↓
App Router (RSC + Client Components)
  ↓
Server Actions / API Routes
  ↓
features/* (queries, actions)
  ↓
Drizzle ORM → PostgreSQL
Redis (캐시, 예정)
MinIO (파일)
```

- **세션** — 32바이트 토큰 → SHA-256 해시 DB 저장, httpOnly 쿠키
- **커서 페이지네이션** — `createdAt` + `id` 복합 커서
- **캐시 카운터** — `view_count`, `like_count`, `comment_count` 컬럼으로 목록 N+1 방지

## 향후 예정

- 게시판(board) 재도입
- 댓글 좋아요, 신고, 알림
- Redis 세션 미러·레이트 리미팅
- GitHub Actions 자동 NAS 배포

## 최근 업데이트 요약

- 게시글 에디터: 이미지·동영상·YouTube, 링크·취소선, 정렬, 업로드 진행률·취소, 동영상 커버 프레임 드래그 선택
- 글 목록 썸네일: 이미지 / 동영상 / YouTube 구분 표시
- 댓글 에디터: 등록·취소 버튼을 에디터 하단으로 통합
- 관리자: DB `role`, `/admin` 탭 UI, 계정 생성 스크립트
- 헤더 프로필 아바타, 글 작성 취소 버튼
- sanitize·S3 업로드 정책 확장 (posts/comments 미디어)

## 라이선스

Private
