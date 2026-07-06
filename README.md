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

- **회원가입** — 가입 완료 후 **이메일 인증 필수** (인증 전 로그인 불가, 자동 로그인 없음)
- 헤더 로그인·회원가입 모달, `?next=` 리다이렉트 지원
- **가입 후 프로필 설정 모달** — 표시 이름·소개·아바타 (선택, **나중에 하기** 시 기본 프로필 유지)
- **회원가입 비밀번호** — 8자 이상·영문+숫자 포함 검증, 비밀번호 확인, 실시간 조건 체크리스트
- **입력 안내 툴팁** — 아이디·비밀번호 라벨 옆 정보(ⓘ) 아이콘, 클릭 시 규칙 표시
- **아이디 찾기** — 가입 이메일로 아이디 안내 메일 (`/login/find-username`)
  - 등록 여부와 관계없이 동일 응답 (계정 열거 방지)
- **비밀번호 찾기** — 재설정 링크 메일 발송, 1시간 유효 토큰 (`/login/forgot-password` → `/reset-password`)
  - 등록 여부·비밀번호 유무와 관계없이 동일 응답 (계정 열거 방지)
- **이메일 변경 인증** — 새 이메일로 확인 링크 발송 → `/confirm-email-change?token=` 확인 후 반영
  - `email_change_tokens` 테이블(해시 저장, 만료 시간)
- 프로필 비밀번호·이메일·**보안 설정** (`/u/[username]/settings/...`)
- **관리자 권한** — `users.role` (`user` \| `admin`) + `ADMIN_USERNAMES` 환경 변수 병행
- 관리자 계정 생성·승격 스크립트 (`scripts/create-admin-user.mjs`, `scripts/nas-promote-admin.sh`)
- **레이트 리미팅** (Redis 고정 윈도우, 장애 시 fail-open)
  - 로그인 IP/계정, 회원가입 IP, 아이디·비밀번호 찾기, 업로드, 신고 등 주요 액션에 적용
- **가입 이메일 인증** — 가입 후 인증 메일 (`/verify-email`), 미인증 시 로그인 불가, 재발송 (`/login/resend-verification`)
- **계정 열거 방지** — 아이디 찾기·비밀번호 재설정 요청 시 동일 응답
- **유출 비밀번호 차단** — Have I Been Pwned k-anonymity (가입·변경·재설정)
- **로그인 알림** — 새 IP 로그인 시 이메일 알림
- **활성 세션 관리** — `/u/[username]/settings/security`에서 기기별 세션 종료
- **TOTP 2단계 인증** — 인증 앱 연동, 로그인 시 6자리 코드 추가 입력

### 게시글

- **글 작성 / 수정** — `PostForm` 공용 컴포넌트 (동일 UI·에디터)
  - 작성: `/write` — 취소 시 홈 이동
  - 수정: `/posts/[id]/edit` — 저장·글 삭제(soft delete)
  - **작성 / 미리보기** 탭 — 에디터 DOM 유지(탭 전환 시 내용 보존), 발행 전 WYSIWYG 확인
  - **에디터·발행 HTML 일치** — 공용 `.post-content` 스타일 + 확장 sanitize (목록·표·색상·정렬 등)
- **관리자 게시글 분류** (탭 UI)
  - `general` — 일반게시글 (홈 피드)
  - `notice` — 공지사항 (홈 aside + `/notices` 게시판)
  - 일반 회원은 항상 일반게시글만 등록
- **리치 텍스트 에디터** (서버 HTML sanitize, `src/lib/rich-text-editor-format.ts`)
  - **서식 툴바** — 굵게·기울임·취소선(토글 해제 포함)·글자 크기·색상·링크·정렬
  - 툴바 클릭 시 **선택 영역 유지** (`mousedown` 저장 → 포커스 복원 후 적용)
  - **글자 크기** — 부분 선택·한 줄 전체·`Ctrl+A` 전체 선택 모두 지원 (블록/텍스트 단위)
  - **색상** — `foreColor` 기반 적용
  - 굵게·기울임·취소선 — `execCommand` + `styleWithCSS` (일반 WYSIWYG 패턴)
  - **이미지** 업로드 (JPEG/PNG/WebP/**GIF**, 최대 100MB) — 선택 후 X 삭제, 좌·가운데·우 정렬, **드래그 핸들 수동 리사이즈**
  - 발행 본문 — 에디터 정렬·인라인 `width` 스타일 보존 (`dangerouslySetInnerHTML`, `max-w-full`)
  - **동영상** 업로드 (MP4/WebM/MOV, 최대 1GB) — 진행률·취소, 커버 프레임 드래그 선택
  - **YouTube** embed 삽입
  - 툴바 아이콘 버튼은 border 없는 플랫 스타일 (`크기` 드롭다운만 border 유지)
  - **키보드 단축키**
    - `Tab` / `Shift+Tab` — 들여쓰기 / 내어쓰기
    - 들여쓰기 줄 맨 앞에서 `Backspace` — 내어쓰기 (커서 점프 없음)
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
- **무한 깊이 스레드** — depth별 들여쓰기·세로선, `↳ @username에게 답글` 표시
  - depth 0 직계 답글은 기본 노출, **depth 1+** 하위는 **`답글 보기 (n)`** / `답글 숨기기` 접기
- **댓글 정렬** — 최신순 / 인기순 / 오래된순 (`?commentSort=`, 필터 아이콘 드롭다운)
  - 최상위 댓글만 정렬, 답글은 작성순 유지
- 글 상세 **댓글 (n)** 헤더 + 정렬 필터 (왼쪽 정렬)
- 리치 텍스트 (이미지·링크) — JPEG/PNG/WebP/**GIF** (최대 5MB)
- 에디터 하단 등록·취소 버튼
- 작성자 표시 이름·아바타, **좋아요 → 답글 → 신고/삭제** 액션 순
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

### 접근성

- **본문 바로가기** — `SkipToContent` (Tab 첫 입력 시 표시) → `#main-content`
- **키보드 포커스** — `:focus-visible` 전역 outline, `prefers-reduced-motion` 대응
- **모달** — ESC·Tab 포커스 트랩·닫을 때 포커스 복귀 (`useModalA11y`, 공용 `Modal`)
- **드롭다운** — 알림 벨·프로필 메뉴 ESC 닫기, `aria-expanded` / `aria-controls` / `aria-haspopup`
- **검색** — combobox + listbox, ↑↓·Enter·ESC 키보드 탐색
- **폼 오류** — `role="alert"` (로그인·신고 등)

### 관리자 (`/admin`)

- 관리자 전용 (로그인 + `role=admin` 또는 `ADMIN_USERNAMES`)
- **모더레이션 패널** (`/admin`) — 탭: 최신 글 / 최신 댓글 / 사용자 / 신고 / 감사 로그
- **운영 대시보드** (`/admin/dashboard`) — Recharts 기반 분석 UI, **영역별 탭**
  - **개요** — 운영 KPI(회원·글·댓글·미처리 신고), 커뮤니티 30일 추이(가입·글·댓글·활동 유저)
  - **콘텐츠** — 게시글 분류 분포, 글당 평균 댓글·좋아요, 조회수 TOP 10
  - **사용자** — 회원·팔로우 지표, 글 미작성 비율, 활발한 작성자 TOP 10
  - **운영** — 신고 사유/상태, 처리 시간·삭제 비율, 감사 로그 (미처리 신고 탭 뱃지)
  - **방문자** — Umami UV·PV·인기 페이지·유입·기기 (미설정 시 안내 문구)
  - 집계: `src/features/admin/analytics.ts` (Drizzle + Redis 5분 캐시)
- 글·댓글 삭제, 사용자 role 변경 (`user` ↔ `admin`), 신고 해결/기각
- 헤더 프로필 메뉴에 관리자 링크 (관리자만)
- **감사 로그** — 공지 등록/수정, 글·댓글 삭제, role 변경, 신고 해결/기각 등 관리자 행위 기록

### 방문자 분석 (Umami, 선택)

- **셀프호스팅 Umami** — `docker-compose.nas.yml`의 `umami` + `umami-db` (운영 DB와 분리)
- **추적 스크립트** — `layout.tsx`에 `UmamiScript` (`NEXT_PUBLIC_UMAMI_*`, 미설정 시 미삽입)
- **관리자 대시보드 연동** — `src/server/analytics/umami.ts` (서버 전용)
  - **셀프호스팅(v3)** — `UMAMI_USERNAME` / `UMAMI_PASSWORD`로 `/api/auth/login` → Bearer 토큰 (Redis 60분 캐시, 401 시 재로그인)
  - **Umami Cloud 등** — `UMAMI_API_TOKEN` 정적 토큰 하위 호환
  - UV·PV·유입 경로·인기 페이지·기기 분포 (API 장애 시 해당 탭만 폴백)
- **개인정보** — `/privacy`에 방문 통계 수집 고지

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
- **모바일 하단 탭바** (`MobileBottomNav`, `md` 미만): 홈 · 팔로우 · **+**(글쓰기) · 알림 · MY
  - 안 읽은 알림 뱃지 폴링
- **모바일 상단 햄버거 메뉴** (`MobileHeaderMenu`): 전체글 · 팔로우글 · 공지사항 · 다크모드
  - 현재 경로·`feed` 기준 활성 탭 강조, iOS safe-area 대응
  - **글쓰기·수정·관리자·로그인** 페이지에서는 탭바 숨김 (폼/관리 UI와 겹침 방지)
  - 프로필 → 프로필 페이지 설정 모달에서 **로그아웃 · 관리자** 진입 (본인·관리자만)
- 글 상세·검색·알림 등 하단 콘텐츠 **여백 보강** (`pb-20`) — 탭바와 겹치지 않도록
- 관리자 패널·검색 탭·검색 등 가로 넘침 요소는 `overflow-x-auto` 처리

### 파일 · 스토리지

- MinIO(S3 호환) — `uploads` 버킷
- prefix: `avatars/`, `posts/`, `comments/`
- presigned PUT 업로드 + 공개 읽기
- **게시글·댓글 GIF** — `image/gif` MIME, 확장자 fallback 지원
- **`next/image` 최적화** — 아바타·글 썸네일 등 원격 이미지 (`RemoteImage`, S3·YouTube `remotePatterns`)
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
- **GitHub Actions CI** (`.github/workflows/ci.yml`) — push/PR마다 lint + typecheck + unit test + **Playwright E2E**
- **Vitest** — 권한·레이트리밋·미디어 URL 정책·메타데이터·신고 검증·게시글 HTML sanitize·댓글 정렬·GIF 업로드·비밀번호 규칙·**관리자 analytics 유틸** 등 (`npm run test`)
- **Playwright E2E** — 로그인·글·댓글·GIF·**관리자 대시보드 접근 제어** (`npm run test:e2e`, `npm run e2e:seed`)
- **구조화 서버 로깅** (`src/lib/logger.ts`, `src/instrumentation.ts`) — 운영 RSC 오류를 `docker logs`에서 추적
- **main push → NAS 자동 배포** (`.github/workflows/deploy-nas.yml`, GitHub Secrets 필요 — 아래 NAS 섹션)

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
| Auth | Argon2id, 자체 세션, 이메일 인증, TOTP 2FA (`otplib`) |
| Validation | Zod v4 |
| Client State | TanStack Query |
| Charts | Recharts (관리자 대시보드) |
| Analytics | Umami (셀프호스팅, 선택) |
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
│   └── admin/                # 관리자 액션, 감사 로그, analytics 집계
├── server/
│   └── analytics/            # Umami API 클라이언트
├── lib/
│   ├── rich-text-editor-format.ts
│   ├── umami-env.ts          # NEXT_PUBLIC Umami 설정
│   └── sanitize-post-html-core.ts
└── db/migrations/
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

캐시 초기화 후 재시작이 필요할 때:

```bash
rm -rf .next node_modules/.cache
npm run docker:up
npm run dev
```

> **주의 (lockfile / node_modules):**
> - macOS에서 `npm install`로 의존성을 추가·갱신한 뒤 **커밋 전**에는 Docker와 동일한 lockfile을 맞추세요.
>   ```bash
>   docker run --rm -v "$PWD":/app -w /app node:20-alpine npm install
>   ```
> - Alpine에서 lockfile을 갱신한 뒤 로컬 개발 시에는 macOS용 `node_modules`를 다시 설치하세요.
>   ```bash
>   rm -rf node_modules && npm ci
>   ```
> - Alpine용 `node_modules`가 남으면 `lightningcss` 등 네이티브 모듈 오류가 날 수 있습니다.

| URL | 설명 |
|-----|------|
| http://localhost:3000 | 홈 |
| http://localhost:3000/write | 글 작성 |
| http://localhost:3000/notices | 공지사항 |
| http://localhost:3000/login | 로그인 |
| http://localhost:3000/admin | 관리자 모더레이션 |
| http://localhost:3000/admin/dashboard | 관리자 운영 대시보드 |
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
| `/posts/[id]` | 글 상세 (댓글 정렬 `?commentSort=`) |
| `/posts/[id]/edit` | 글 수정 |
| `/login` | 로그인 |
| `/login/find-username` | 아이디 찾기 |
| `/login/forgot-password` | 비밀번호 찾기 |
| `/login/resend-verification` | 가입 인증 메일 재발송 |
| `/verify-email?token=` | 가입 이메일 인증 확인 |
| `/reset-password?token=` | 비밀번호 재설정 |
| `/signup` | 회원가입 |
| `/admin` | 관리자 모더레이션 |
| `/admin/dashboard` | 관리자 운영 대시보드 (Recharts) |
| `/privacy` | 개인정보처리방침 (Umami 고지) |
| `/u/[username]` | 프로필 |
| `/u/[username]/followers` | 팔로워 (모달/풀페이지) |
| `/u/[username]/following` | 팔로잉 (모달/풀페이지) |
| `/u/[username]/edit` | 프로필 수정 |
| `/u/[username]/settings/password` | 비밀번호 변경 |
| `/u/[username]/settings/email` | 이메일 변경 |
| `/u/[username]/settings/security` | 보안 설정 (세션·TOTP 2FA) |
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
| `npm run test` | Vitest 단위 테스트 |
| `npm run qa:smoke` | HTTP 스모크 + vitest (dev 서버 권장) |
| `npm run test:e2e` | Playwright E2E (로그인·글·댓글·GIF) |
| `npm run e2e:seed` | E2E 테스트용 시드 사용자 생성 |
| `npm run docker:up` / `docker:down` | 로컬 Docker |
| `npm run db:migrate` | 마이그레이션 |
| `npm run deploy:nas` | NAS 배포 (NAS에서 실행) |
| `npm run migrate:nas` | NAS DB 마이그레이션 |
| `npm run doctor:nas` | NAS 진단 (DB·헬스체크) |
| `npm run docker:nas:cloudflare` | NAS + Cloudflare Tunnel (로컬 테스트용 compose) |
| `node scripts/create-admin-user.mjs <username>` | 관리자 생성 (로컬) |
| `./scripts/nas-promote-admin.sh <username>` | NAS 관리자 승격 |

---

## Synology NAS 배포

Cloudflare Tunnel로 **[https://heavyjungle.com](https://heavyjungle.com)** 에 서비스합니다.

### 사전 요구사항

| 항목 | 설명 |
|------|------|
| Synology DSM | Docker 패키지 설치 |
| Git | SSH 또는 패키지 센터에서 설치 |
| Cloudflare | Zero Trust Tunnel + `heavyjungle.com`, `s3.heavyjungle.com` hostname |
| Resend | 도메인 인증 후 `RESEND_API_KEY`, `EMAIL_FROM` |
| GitHub (선택) | `main` push 시 자동 배포용 Repository Secrets |

권장 경로: `/volume1/docker/heavyjungle`

### 최초 설정 (1회)

```bash
# 1) 저장소 클론
mkdir -p /volume1/docker
cd /volume1/docker
git clone https://github.com/realmind87/heavyjungle.git
cd heavyjungle

# 2) 환경 변수
cp .env.nas.example .env
vi .env   # POSTGRES_PASSWORD, CLOUDFLARE_TUNNEL_TOKEN, RESEND 등 설정

# 3) 빌드·기동 (Cloudflare Tunnel 포함)
sudo docker compose -f docker-compose.nas.yml --profile cloudflare up -d --build

# 4) DB 마이그레이션
./scripts/nas-migrate.sh

# 5) 관리자 승격 (이미 가입한 계정)
./scripts/nas-promote-admin.sh <username>

# 6) 상태 확인
./scripts/nas-doctor.sh
curl -s http://localhost:3000/api/health | head
```

**NAS `.env` 필수 항목 예시:**

```env
POSTGRES_PASSWORD=강한-비밀번호
MINIO_ROOT_PASSWORD=강한-비밀번호
CLOUDFLARE_TUNNEL_TOKEN=eyJh...
S3_PUBLIC_URL=https://s3.heavyjungle.com/uploads
APP_URL=https://heavyjungle.com
RESEND_API_KEY=re_...
EMAIL_FROM="Heavy Jungle <noreply@heavyjungle.com>"
ADMIN_USERNAMES=your_admin_id
```

**Cloudflare Tunnel Public Hostname (예시)**

| Hostname | Service |
|----------|---------|
| `heavyjungle.com` | `http://app:3000` |
| `s3.heavyjungle.com` | `http://minio:9000` |

> `S3_PUBLIC_URL`은 Docker **빌드 시** `NEXT_PUBLIC_S3_PUBLIC_URL`에도 박힙니다. 값 변경 후 반드시 `--build`로 재배포하세요.

### 업데이트 배포 (수동)

```bash
cd /volume1/docker/heavyjungle
git pull origin main
./scripts/nas-deploy.sh
```

`nas-deploy.sh`는 `git pull` → `docker compose up -d --build` → `nas-migrate.sh` → 헬스체크까지 수행합니다.

**Docker `npm ci` 실패 시** (`Missing: esbuild@0.28.1` 등) — lockfile이 macOS npm 11과 Linux npm 10에서 어긋난 경우입니다. 프로젝트 루트에서 Alpine으로 재생성:

```bash
docker run --rm -v "$PWD":/app -w /app node:20-alpine npm install
git add package-lock.json && git commit -m "Fix package-lock for Linux Docker npm ci"
```

이후 NAS에서 `git pull` + `./scripts/nas-deploy.sh`로 재배포합니다.

### GitHub Actions 자동 배포 설정

`main` 브랜치 push 시 NAS에 SSH로 `nas-deploy.sh`를 실행합니다.  
저장소 **Settings → Secrets and variables → Actions** 에 아래를 등록하세요.

| Secret | 설명 | 예시 |
|--------|------|------|
| `NAS_HOST` | NAS IP 또는 DDNS 호스트 | `192.168.0.10` |
| `NAS_USER` | SSH 사용자 | `admin` |
| `NAS_SSH_KEY` | SSH 개인키 (PEM 전체) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `NAS_PORT` | SSH 포트 (선택) | `22` |
| `NAS_DEPLOY_PATH` | 배포 경로 (선택) | `/volume1/docker/heavyjungle` |

Secrets가 없으면 워크플로는 **건너뛰고** CI만 실행됩니다.  
수동 실행: GitHub **Actions → Deploy to NAS → Run workflow**.

**Synology SSH 준비**

1. 제어판 → 터미널 및 SNMP → SSH 활성화
2. 사용자 계정에 `docker` 그룹 권한 (또는 `sudo` 없이 docker 실행 가능하도록 설정)
3. `nas-deploy.sh`는 `sudo docker compose`를 사용 — 배포 계정에 passwordless sudo 또는 docker 권한 필요

### 운영 관리

```bash
./scripts/nas-doctor.sh              # DB·테이블·헬스 진단
./scripts/nas-migrate.sh             # 마이그레이션만
./scripts/nas-migrate-repair.sh      # 마이그레이션 꼬였을 때 (주의)
./scripts/nas-promote-admin.sh <id>  # 관리자 승격
sudo docker compose -f docker-compose.nas.yml logs -f app   # 앱 로그
sudo docker compose -f docker-compose.nas.yml logs -f umami  # Umami 로그
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
| `NEXT_PUBLIC_UMAMI_SRC` | Umami 스크립트 베이스 URL (빌드 시 주입) |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Umami 웹사이트 ID (브라우저 추적) |
| `UMAMI_API_URL` | Umami API URL (서버, Docker 내부 `http://umami:3000` 권장) |
| `UMAMI_WEBSITE_ID` | Umami 웹사이트 ID (대시보드 API) |
| `UMAMI_USERNAME` | Umami 관리자 아이디 (셀프호스팅 로그인, 서버 전용) |
| `UMAMI_PASSWORD` | Umami 관리자 비밀번호 (서버 전용, `NEXT_PUBLIC` 금지) |
| `UMAMI_API_TOKEN` | Umami Cloud 정적 API 토큰 (선택, 셀프호스팅은 비워둠) |
| `UMAMI_DB_PASSWORD` | Umami 전용 Postgres 비밀번호 (NAS compose) |
| `UMAMI_APP_SECRET` | Umami 앱 시크릿 (NAS compose) |

로컬은 `.env.example`, NAS는 `.env.nas.example` 참고. Docker Compose는 미설정 Umami 변수를 빈 문자열로 주입하므로, 앱은 빈 값을 “미설정”으로 처리합니다.

### Umami 설정 (NAS)

1. `.env`에 `UMAMI_DB_PASSWORD`, `UMAMI_APP_SECRET` 설정
2. `docker compose -f docker-compose.nas.yml up -d umami-db umami`
3. Cloudflare Tunnel에 `analytics.heavyjungle.com` → `http://umami:3000` 추가
4. Umami UI에서 관리자 계정·웹사이트 생성 → **웹사이트 ID** 확인
5. `.env` 예시 (셀프호스팅):

```env
NEXT_PUBLIC_UMAMI_SRC=https://analytics.heavyjungle.com
NEXT_PUBLIC_UMAMI_WEBSITE_ID=<website-uuid>
UMAMI_API_URL=http://umami:3000
UMAMI_WEBSITE_ID=<website-uuid>
UMAMI_USERNAME=admin
UMAMI_PASSWORD=<umami-admin-password>
# UMAMI_API_TOKEN=   ← 셀프호스팅은 비워둠
```

6. **`--build` 재배포** (`NEXT_PUBLIC_*`는 빌드 시 주입)

Umami 미설정 시에도 자체 운영 대시보드(`/admin/dashboard`)는 정상 동작합니다.

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
- **Redis 세션 미러** — `session:t:{hash}` + `session:u:{userId}` (검증 시 join 생략, Redis 장애 시 fail-open)
- **업로드** — 서버가 presigned PUT URL 발급 → 브라우저가 MinIO에 직접 PUT
- **커서 페이지네이션** — 정렬별 복합 커서 (`createdAt`+`id`, `likeCount`+`id`)
- **카운터 캐시** — `view_count`, `like_count`, `comment_count`
- **소셜** — `follows`, `blocks` 테이블, 피드·상호작용에서 차단 관계 반영
- **공지** — `posts.category` (`general` \| `notice`)
- **알림/신고** — `notifications`, `reports`, `admin_audit_logs` 테이블
- **레이트 리미팅** — Redis `INCR` + `EXPIRE` 고정 윈도우, Redis 장애 시 fail-open

---

## 작업 현황 & 남은 할 일

### 완료 (최근)

- [x] Umami 방문자 분석 셀프호스팅 (NAS Docker: `umami` + `umami-db`)
- [x] 추적 스크립트 연결 (`NEXT_PUBLIC_UMAMI_*`)
- [x] 관리자 운영 대시보드 (`/admin/dashboard`) — KPI·추이·콘텐츠·사용자·운영·방문자 **탭 UI**
- [x] Admin 대시보드 Umami 연동 (로그인 방식 API — 셀프호스팅용)
- [x] **계정 보안 5종** — 이메일 인증, 계정 열거 방지, HIBP 유출 비밀번호 차단, 로그인 알림·세션 관리, TOTP 2FA
- [x] Docker `npm ci` lockfile 수정 (recharts·otplib 이후 NAS 빌드)
- [x] 502 원인 수정 (`env.ts` 빈 문자열 검증 이슈)

### 남은 할 일 — 보안 마무리 (운영 확인)

- [ ] Umami 기본 비밀번호(`admin`/`umami`) 변경 → `.env` `UMAMI_PASSWORD` 동기화
- [ ] MinIO 기본 비밀번호(`minioadmin`) 변경
- [ ] `analytics.heavyjungle.com` 피싱 경고 처리 (Cloudflare Access 또는 Search Console 검토 요청)
- [ ] `heavyjungle.com` Safe Browsing 정상 확인

### 선택 확장 아이디어

- [ ] 방문자·운영 지표 매일 아침 요약 (스케줄 작업)
- [ ] Admin 대시보드 실시간 접속자 위젯

### 기타 향후 예정

- OAuth 소셜 로그인
- 아이디 실시간 중복 확인 API
- 외부 복사 붙여넣기 시 폰트·스타일 정리 (plain / smart paste)
- 로컬 `docker-compose.yml`에 Umami 서비스 추가 (선택)

---

## 라이선스

Private
