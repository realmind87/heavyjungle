# Heavy Jungle (heavyjungle)

Next.js App Router 기반 커뮤니티 웹 애플리케이션입니다. Server Component를 기본으로 하며, 자체 세션 인증·게시글·댓글·팔로우·차단·공지·검색·프로필·관리자·NAS Docker 배포까지 포함합니다.

## 서비스 URL

| 환경 | URL | 비고 |
|------|-----|------|
| **프로덕션** | [https://heavyjungle.com](https://heavyjungle.com) | Synology NAS + Docker + Cloudflare Tunnel |
| S3 공개 URL | [https://s3.heavyjungle.com/uploads](https://s3.heavyjungle.com/uploads) | MinIO presigned PUT + 공개 읽기 |
| 로컬 개발 | http://localhost:3000 | `npm run dev` |

프로덕션 사이트명: **Heavy Jungle**

---

## 구현된 기능

### 인증 · 계정

- 회원가입 / 로그인 / 로그아웃 (Server Actions + httpOnly 세션 쿠키)
- 헤더 로그인·회원가입 모달, `?next=` 리다이렉트 지원
- **아이디 찾기** — 가입 이메일로 아이디 안내 메일 (`/login/find-username`)
  - 미등록 이메일이면 `"등록된 이메일이 아닙니다."` 오류 표시
- **비밀번호 찾기** — 재설정 링크 메일 발송, 1시간 유효 토큰 (`/login/forgot-password` → `/reset-password`)
  - 미등록 이메일 / 소셜 로그인 등 비밀번호 없는 계정 각각 안내 메시지 구분
- **이메일 변경 인증** — 새 이메일로 확인 링크 발송 → `/confirm-email-change?token=` 확인 후 반영
  - `email_change_tokens` 테이블(해시 저장, 만료 시간)
- 프로필 비밀번호·이메일 변경 (`/u/[username]/settings/...`)
- **관리자 권한** — `users.role` (`user` \| `admin`) + `ADMIN_USERNAMES` 환경 변수 병행
- 관리자 계정 생성·승격 스크립트 (`scripts/create-admin-user.mjs`, `scripts/nas-promote-admin.sh`)
- **레이트 리미팅** (Redis 고정 윈도우, 장애 시 fail-open)
  - 로그인 IP/계정, 회원가입 IP, 아이디·비밀번호 찾기, 업로드, 신고 등 주요 액션에 적용

### 게시글

- **글 작성 / 수정** — `PostForm` 공용 컴포넌트 (동일 UI·에디터)
  - 작성: `/write` — 취소 시 홈 이동
  - 수정: `/posts/[id]/edit` — 저장·글 삭제(soft delete)
- **관리자 게시글 분류** (탭 UI)
  - `general` — 일반게시글 (홈 피드)
  - `notice` — 공지사항 (홈 aside + `/notices` 게시판)
  - 일반 회원은 항상 일반게시글만 등록
- **리치 텍스트 에디터** (서버 HTML sanitize)
  - 굵게·기울임·취소선·링크·글자 크기·색상·정렬
  - **이미지** 업로드 (JPEG/PNG/WebP, 최대 100MB) — 선택 후 X 삭제, 좌·가운데·우 정렬
  - **동영상** 업로드 (MP4/WebM/MOV, 최대 1GB) — 진행률·취소, 커버 프레임 드래그 선택
  - **YouTube** embed 삽입
  - 툴바 아이콘 버튼은 border 없는 플랫 스타일 (`크기` 드롭다운만 border 유지)
  - **키보드 단축키**
    - `Tab` / `Shift+Tab` — 들여쓰기 / 내어쓰기
    - 들여쓰기 줄 맨 앞에서 `Backspace` — 내어쓰기
    - `Ctrl+B` / `Ctrl+I` / `Ctrl+K` / `Ctrl+Shift+S` — 굵게 / 기울임 / 링크 / 취소선
    - `Shift+Enter` — 줄바꿈(soft break)
- **홈 글 목록**
  - 정렬: 최신순 / 인기순 / 오래된순
  - 보기: 리스트 / 썸네일 카드
  - 피드: **전체 글** / **팔로우 글 보기** (`?feed=following`, 로그인 필요)
  - 커서 페이지네이션 + 더 보기
  - 리스트 뷰 — 본문 미디어(이미지·영상·유튜브)가 있으면 **오른쪽 썸네일** 표시
- 썸네일 — 본문 첫 이미지 / 동영상 포스터 / YouTube 썸네일
- 글 상세 — 조회수·좋아요·댓글 수, 작성자 표시 이름·아바타

### 공지사항

- 관리자가 `공지사항` 분류로 등록
- 홈 **aside** — 최신 5개 + **전체보기**
- `/notices` — 공지 게시판 전체 목록 (더 보기)
- 공지 상세에서 목록 복귀 시 `/notices`로 이동

### 댓글

- 댓글 작성 / 삭제 (soft delete)
- 1단계 대댓글 (중첩 스레드)
- 리치 텍스트 (이미지·링크) — 에디터 하단 등록·취소 버튼
- 작성자 표시 이름·아바타 표시
- 댓글 카드 border 없음, **작성 폼**은 border 유지
- 답글 등록 성공 시 답글창 자동 닫힘, 일반 댓글은 입력 초기화

### 좋아요 · 조회수

- 글 좋아요 토글 (`useOptimistic`)
- **댓글 좋아요** — 하트 아이콘 토글, `useOptimistic`, `comments.like_count` 카운터 캐시
- 조회수 증가 API (`PostViewCount`)

### 신고 · 모더레이션

- 글/댓글 **신고** 버튼 — 사유 선택(스팸·욕설·음란물·기타) + 상세 사유 입력
- 자기 글 신고 불가, 중복 신고 방지, IP/계정 기준 레이트 리미팅(시간당 20/10회)
- **관리자 신고함** (`/admin` → 신고 탭) — 대기 중 신고 우선 정렬, 미해결 건수 배지
  - **해결** — 대상 글/댓글 소프트 삭제 + 신고 상태 변경
  - **기각** — 신고 상태만 변경
  - 처리 내역은 관리자 감사 로그에 자동 기록

### 알림

- 헤더 **알림 벨** — 안 읽은 개수 배지, 클릭 시 목록 표시 + 전체 읽음 처리
- **30초 폴링** + 창 포커스 시 `/api/notifications/unread-count`로 뱃지 자동 갱신
- **`/notifications` 전용 페이지** — 페이지네이션(더 보기), 개별·전체 삭제, 방문 시 모두 읽음
- 트리거: 팔로우, 댓글, 대댓글, 글 좋아요, 댓글 좋아요, **신고 처리 결과**(조치/기각)
- 자기 자신 알림·차단 관계 알림 제외
- 알림 클릭 시 해당 글/프로필로 이동 (시스템 알림은 알림 페이지)

### 팔로우 · 팔로잉

- 프로필에서 팔로우 / 언팔로우
- 팔로워·팔로잉 수 표시 (클릭 시 목록)
- **App Router 인터셉트 모달** — `/u/[username]/followers`, `/following`
  - 소프트 내비: 모달 / 하드 내비·새로고침: 풀페이지
  - 목록 내 **아이디·표시 이름 검색**
- 홈 **팔로우 글 보기** — 팔로우한 회원의 일반 게시글만 표시

### 차단

- 다른 사용자 프로필 설정 메뉴에서 **차단** / **차단 해제** (빨간색)
- 차단 시 양방향 팔로우 자동 해제
- 차단 관계: 프로필·글·댓글·좋아요·팔로우 제한, 홈 피드에서 제외
- 본인 프로필 설정 → **차단한 사용자** 목록 + 목록에서 차단 해제

### 프로필

- 공개 프로필 (`/u/[username]`) — 표시 이름·@아이디·소개·아바타
- 메인 통계: **글 / 팔로워 / 팔로잉** 만 표시
- **설정(톱니) 모달**
  - 정보 (받은 좋아요·가입일)
  - 본인: 프로필 수정, 비밀번호·이메일 변경, 차단한 사용자, 관리자(관리자만), 로그아웃
  - 타인: 차단 / 차단 해제
- **표시 이름** — 헤더·글 목록·댓글·글 상세 전역 반영 (없으면 아이디 사용)
- 프로필 수정 — 표시 이름·소개·아바타 (모달 / 풀페이지)
- MinIO(S3) presigned URL 아바타 업로드

### 검색

- **헤더 드롭다운** — 300ms debounce 자동완성, ↑↓ / Enter / ESC, 외부 클릭 닫기, 로딩 스피너, AbortController
  - **게시글 검색** — 제목(하이라이트)·작성자·작성일 → `/posts/[id]`
  - **@유저 검색** — `@`로 시작하면 유저 모드, 닉네임/아이디 부분 일치 → `/u/[username]`
  - 드롭다운 하단 **"전체 결과 보기"** → `/search`
  - 차단 관계인 작성자/사용자는 결과에서 제외
- **`/search` 전체 결과 페이지** — 게시글 / 사용자 탭, "더 보기" 페이지네이션
  - 게시글: **제목 + 본문** 검색 (HTML 태그 제거 후 매칭), 검색어 주변 문맥 스니펫 하이라이트
  - **pg_trgm** GIN 인덱스 + 유사도(`similarity`) 기반 관련도 정렬
- `SearchBar` + `useSearch` + `/api/search/posts` · `/api/search/users` (limit/offset)

### SEO · 공유 미리보기

- **`generateMetadata`** — 글 상세·프로필·루트 레이아웃 Open Graph / Twitter Card
- 본문 첫 이미지 → OG 이미지, HTML 제거 plain text → description
- **`/sitemap.xml`** — 홈·공지 + 최근 글·프로필 URL (최대 1000/500건)
- **`/robots.txt`** — `/admin`, `/api/` 등 크롤 제외

### 관리자 (`/admin`)

- 관리자 전용 (로그인 + `role=admin` 또는 `ADMIN_USERNAMES`)
- 탭: **최신 글** / **최신 댓글** / **사용자** / **신고** / **감사 로그**
- 글·댓글 삭제, 사용자 role 변경 (`user` ↔ `admin`), 신고 해결/기각
- 헤더 프로필 메뉴에 관리자 링크 (관리자만)
- **감사 로그** — 공지 등록/수정, 글·댓글 삭제, role 변경, 신고 해결/기각 등 관리자 행위 기록
  - 행위자·대상·메타데이터·시각 표시

### UI · 브랜딩

- **Heavy Jungle** 로고 — 라이트 `logo.png` / 다크 `logo_dark.png`
- 파비콘 (`public/favicon.ico`, `src/app/icon.png`)
- **라이트 / 다크 모드** — 헤더 `ThemeToggle` (로그인 여부와 무관)
- 홈 aside (lg+): 피드 메뉴(로그인 시) + 공지사항

### 반응형 (모바일)

- **데스크톱 헤더** (`md+`): 로고 | 인라인 검색 | 테마·인증·알림·글쓰기·프로필 한 줄
- **모바일 헤더** (`md` 미만): 2행 구성
  - 1행: `테마` · 가운데 **로고**(축소) · `알림`(로그인) / `로그인`(비로그인)
  - 2행: **전체폭 검색바**
- **모바일 하단 탭바** (`MobileBottomNav`, `md` 미만): 전체글 · 팔로우 글 · **등록**(가운데 강조) · 공지사항 · 프로필
  - 현재 경로·`feed` 기준 활성 탭 강조, iOS safe-area 대응
  - 프로필 → 프로필 페이지 설정 모달에서 **로그아웃 · 관리자** 진입 (본인·관리자만)
- 관리자 패널 탭·검색 등 가로 넘침 요소는 `overflow-x-auto` 처리

### 파일 · 스토리지

- MinIO(S3 호환) — `uploads` 버킷
- prefix: `avatars/`, `posts/`, `comments/`
- presigned PUT 업로드 + 공개 읽기
- **HTTPS 운영** — `S3_PUBLIC_URL` / `NEXT_PUBLIC_S3_PUBLIC_URL` (Docker **빌드 시** 주입)
- Cloudflare Tunnel로 `s3.heavyjungle.com` → MinIO 노출

### 이메일 (Resend)

- 아이디 안내·비밀번호 재설정 메일 (`[Heavy Jungle]` 제목)
- **로컬**: `RESEND_API_KEY` 없으면 터미널 콘솔 출력
- **운영**: `RESEND_API_KEY` + `EMAIL_FROM` 필수 (미설정 시 발송 실패 오류)
- `EMAIL_FROM` 예: `Heavy Jungle <noreply@heavyjungle.com>` (Resend 도메인 인증 후 자유 설정)
- NAS `.env`에서 `EMAIL_FROM`에 공백·`<>`가 있으면 **따옴표**로 감싸기

### 인프라 · 개발 DX

- Docker Compose — PostgreSQL, Redis, MinIO (로컬 / NAS)
- Drizzle ORM 마이그레이션 (`follows`, `blocks`, `posts.category` 등)
- `npm run dev` 시 로컬 DB 자동 기동 (`scripts/ensure-local-db.sh`)
- NAS 배포: `scripts/nas-deploy.sh`, `scripts/nas-migrate.sh`, `scripts/nas-doctor.sh`
- **GitHub Actions CI** (`.github/workflows/ci.yml`) — push/PR마다 lint + typecheck
- **구조화 서버 로깅** (`src/lib/logger.ts`, `src/instrumentation.ts`) — 운영 RSC 오류를 `docker logs`에서 추적
- NAS 수동 배포 워크플로 (`deploy-nas.yml`, `workflow_dispatch`)

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 15 (App Router, Turbopack, standalone Docker) |
| UI | React 19, Tailwind CSS v4 |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Storage | MinIO (S3 호환, AWS SDK presigned URL) |
| Auth | Argon2id, 자체 세션 (DB + httpOnly 쿠키) |
| Validation | Zod v4 |
| Client State | TanStack Query |
| Email | Resend API |
| Infra | Docker Compose, Cloudflare Tunnel |

---

## 프로젝트 구조

```
src/
├── app/                      # App Router 페이지·API
│   ├── api/                  # REST (/health, /search/..., /posts/...)
│   ├── admin/                # 관리자
│   ├── login/                # 로그인, 아이디/비밀번호 찾기
│   ├── notices/              # 공지사항 게시판
│   ├── posts/[id]/           # 글 상세·수정
│   ├── write/                # 글 작성
│   ├── u/[username]/         # 프로필·팔로워/팔로잉·설정 (인터셉트 모달)
│   └── page.tsx              # 홈 (피드 + aside)
├── components/
│   ├── home/                 # HomeSidebar, HomeNotices
│   ├── layout/               # header, site-header
│   └── ui/                   # Modal, ThemeToggle, toast
├── features/
│   ├── auth/
│   ├── posts/                # 글, PostForm, 리치 에디터, 커버 미리보기
│   ├── comments/
│   ├── likes/
│   ├── follows/              # 팔로우·팔로워/팔로잉 목록
│   ├── blocks/               # 차단
│   ├── search/               # SearchBar, useSearch, API, /search 결과 페이지
│   ├── profile/              # 프로필·설정 메뉴
│   ├── uploads/
│   ├── notifications/        # 알림 조회·생성·벨 UI
│   ├── reports/              # 신고 액션·관리자 처리·UI
│   └── admin/                # 관리자 액션, 감사 로그
├── server/                   # DB schema, auth, email, storage, rate-limit(Redis)
├── lib/
└── db/migrations/            # 0013 email_change_tokens ... 0018 comment_likes
```

---

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

### 3. 개발 서버

```bash
npm run dev
```

`predev`가 Docker(Postgres/Redis/MinIO)를 확인·기동합니다.

| URL | 설명 |
|-----|------|
| http://localhost:3000 | 홈 |
| http://localhost:3000/write | 글 작성 |
| http://localhost:3000/notices | 공지사항 |
| http://localhost:3000/login | 로그인 |
| http://localhost:3000/admin | 관리자 |
| http://localhost:9001 | MinIO 콘솔 (minioadmin / minioadmin) |

```bash
npm run docker:up    # 수동 DB 기동
npm run db:migrate   # 마이그레이션
```

---

## 주요 라우트

| 경로 | 설명 |
|------|------|
| `/` | 글 목록 (정렬·썸네일·전체/팔로우 피드) |
| `/notices` | 공지사항 게시판 |
| `/write` | 글 작성 |
| `/posts/[id]` | 글 상세 |
| `/posts/[id]/edit` | 글 수정 |
| `/login` | 로그인 |
| `/login/find-username` | 아이디 찾기 |
| `/login/forgot-password` | 비밀번호 찾기 |
| `/reset-password?token=` | 비밀번호 재설정 |
| `/signup` | 회원가입 |
| `/admin` | 관리자 |
| `/u/[username]` | 프로필 |
| `/u/[username]/followers` | 팔로워 (모달/풀페이지) |
| `/u/[username]/following` | 팔로잉 (모달/풀페이지) |
| `/u/[username]/edit` | 프로필 수정 |
| `/confirm-email-change?token=` | 이메일 변경 인증 확인 |
| `/search?q=&type=` | 검색 전체 결과 (게시글/사용자) |

---

## npm 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint |
| `npm run docker:up` / `docker:down` | 로컬 Docker |
| `npm run db:migrate` | 마이그레이션 |
| `npm run deploy:nas` | NAS 배포 |
| `npm run docker:nas:cloudflare` | NAS + Cloudflare Tunnel |
| `node scripts/create-admin-user.mjs <username>` | 관리자 생성 (로컬) |
| `./scripts/nas-promote-admin.sh <username>` | NAS 관리자 승격 |

---

## Synology NAS 배포

Cloudflare Tunnel로 **[https://heavyjungle.com](https://heavyjungle.com)** 에 서비스합니다.

### 최초 설정

```bash
mkdir -p /volume1/docker
cd /volume1/docker
git clone https://github.com/realmind87/heavyjungle.git
cd heavyjungle

cp .env.nas.example .env
# 아래 항목 설정 후 빌드·기동
```

**NAS `.env` 필수 항목 예시:**

```env
POSTGRES_PASSWORD=...
CLOUDFLARE_TUNNEL_TOKEN=...
S3_PUBLIC_URL=https://s3.heavyjungle.com/uploads
APP_URL=https://heavyjungle.com
RESEND_API_KEY=re_...
EMAIL_FROM="Heavy Jungle <noreply@heavyjungle.com>"
ADMIN_USERNAMES=stansfield0125
```

```bash
docker compose -f docker-compose.nas.yml --profile cloudflare up -d --build
./scripts/nas-migrate.sh
```

> `S3_PUBLIC_URL`은 Docker **빌드 시** `NEXT_PUBLIC_S3_PUBLIC_URL`에도 박힙니다. 값 변경 후 반드시 `--build`로 재배포하세요.

### 업데이트 배포

```bash
cd /volume1/docker/heavyjungle
git pull origin main
./scripts/nas-deploy.sh
```

배포 스크립트가 마이그레이션(`follows`, `blocks`, `post_category` 등)을 적용합니다.

### 운영 관리자

```bash
./scripts/nas-migrate.sh
./scripts/nas-promote-admin.sh <username>
```

---

## 환경 변수

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | PostgreSQL |
| `REDIS_URL` | Redis |
| `S3_ENDPOINT` | MinIO 내부 URL (예: `http://minio:9000`) |
| `S3_PUBLIC_URL` | 브라우저용 HTTPS 공개 URL (presigned PUT + 읽기) |
| `NEXT_PUBLIC_S3_PUBLIC_URL` | 클라이언트 번들용 (NAS는 빌드 arg로 `S3_PUBLIC_URL`과 동일) |
| `APP_URL` | 비밀번호 재설정 링크 절대 URL |
| `RESEND_API_KEY` | Resend API 키 (운영 필수) |
| `EMAIL_FROM` | 발신 주소 (공백·`<>` 있으면 따옴표) |
| `ADMIN_USERNAMES` | 관리자 아이디 (쉼표 구분) |

로컬은 `.env.example`, NAS는 `.env.nas.example` 참고.

---

## API

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/health` | DB·Redis 상태 |
| `GET` | `/api/posts` | 글 목록 (데모) |
| `POST` | `/api/posts/[id]/like` | 좋아요 토글 |
| `POST` | `/api/posts/[id]/view` | 조회수 증가 |
| `GET` | `/api/search/posts?q=&limit=&offset=` | 게시글 제목/본문 검색 (페이지네이션) |
| `GET` | `/api/search/users?q=&limit=&offset=` | 유저 닉네임/아이디 검색 (페이지네이션) |
| `GET` | `/api/notifications` | 알림 목록·안읽음 개수 (limit/offset) |
| `GET` | `/api/notifications/unread-count` | 안읽음 개수만 (폴링용) |
| `POST` | `/api/comments/[id]/like` | 댓글 좋아요 토글 |
| `GET/POST` | `/api/items` | CRUD 데모 |

---

## 아키텍처

```
Browser
  ↓
App Router (RSC + Client Components + Intercepting Routes)
  ↓
Server Actions / API Routes
  ↓
features/* (queries, actions)
  ↓
Drizzle ORM → PostgreSQL
Redis (캐시, 예정)
MinIO (S3) ← Cloudflare Tunnel (s3.heavyjungle.com)
Resend (이메일)
```

- **세션** — 32바이트 토큰 → SHA-256 해시 DB, httpOnly 쿠키, sliding renewal
- **업로드** — 서버가 presigned PUT URL 발급 → 브라우저가 MinIO에 직접 PUT
- **커서 페이지네이션** — 정렬별 복합 커서 (`createdAt`+`id`, `likeCount`+`id`)
- **카운터 캐시** — `view_count`, `like_count`, `comment_count`
- **소셜** — `follows`, `blocks` 테이블, 피드·상호작용에서 차단 관계 반영
- **공지** — `posts.category` (`general` \| `notice`)
- **알림/신고** — `notifications`, `reports`, `admin_audit_logs` 테이블
- **레이트 리미팅** — Redis `INCR` + `EXPIRE` 고정 윈도우, Redis 장애 시 fail-open

---

## 향후 예정

- Redis 세션 미러
- GitHub Actions 자동 NAS 배포 (SSH 준비 후 `deploy-nas.yml` push 트리거 활성화)
- 유닛/통합 테스트, `next/image` 이미지 최적화

---

## 라이선스

Private
