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
- 프로필 비밀번호·이메일 변경 (`/u/[username]/settings/...`)
- **관리자 권한** — `users.role` (`user` \| `admin`) + `ADMIN_USERNAMES` 환경 변수 병행
- 관리자 계정 생성·승격 스크립트 (`scripts/create-admin-user.mjs`, `scripts/nas-promote-admin.sh`)

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
- 조회수 증가 API (`PostViewCount`)

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
  - 본인: 프로필 수정, 비밀번호·이메일 변경, 차단한 사용자
  - 타인: 차단 / 차단 해제
- **표시 이름** — 헤더·글 목록·댓글·글 상세 전역 반영 (없으면 아이디 사용)
- 프로필 수정 — 표시 이름·소개·아바타 (모달 / 풀페이지)
- MinIO(S3) presigned URL 아바타 업로드

### 검색 (헤더)

- **게시글 검색** — 제목 부분 일치, 300ms debounce, 자동완성 드롭다운
  - 제목(검색어 하이라이트)·작성자·작성일 → `/posts/[id]`
- **@유저 검색** — `@`로 시작하면 유저 모드
  - 닉네임/아이디 부분 일치 → `/u/[username]`
- ↑↓ / Enter / ESC, 외부 클릭 닫기, 로딩 스피너, AbortController
- `SearchBar` + `useSearch` + `/api/search/posts` · `/api/search/users`

### 관리자 (`/admin`)

- 관리자 전용 (로그인 + `role=admin` 또는 `ADMIN_USERNAMES`)
- 탭: **최신 글** / **최신 댓글** / **사용자**
- 글·댓글 삭제, 사용자 role 변경 (`user` ↔ `admin`)
- 헤더 프로필 메뉴에 관리자 링크 (관리자만)

### UI · 브랜딩

- **Heavy Jungle** 로고 — 라이트 `logo.png` / 다크 `logo_dark.png`
- 파비콘 (`public/favicon.ico`, `src/app/icon.png`)
- **라이트 / 다크 모드** — 헤더 `ThemeToggle` (로그인 여부와 무관)
- 헤더: `flex justify-between` — 로고 | 검색 | 테마·인증·글쓰기·프로필
- 홈 aside (lg+): 피드 메뉴(로그인 시) + 공지사항

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
│   ├── search/               # SearchBar, useSearch, API
│   ├── profile/              # 프로필·설정 메뉴
│   ├── uploads/
│   └── admin/
├── server/                   # DB schema (follows, blocks, posts.category), auth, email, storage
├── lib/
└── db/migrations/            # 0010 follows, 0011 blocks, 0012 post_category
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
| `GET` | `/api/search/posts?q=` | 게시글 제목 검색 |
| `GET` | `/api/search/users?q=` | 유저 닉네임/아이디 검색 |
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

---

## 향후 예정

- 댓글 좋아요, 신고, 알림
- Redis 세션 미러·레이트 리미팅
- GitHub Actions 자동 NAS 배포

---

## 라이선스

Private
