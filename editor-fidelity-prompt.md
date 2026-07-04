# 커스텀 에디터 개선 지시 프롬프트

> heavyjungle 프로젝트에 적용 완료. 다른 프로젝트에 쓸 때는 `[...]` 부분만 바꿔 넣으세요.

---

## 배경
대형 커뮤니티의 **직접 만든 커스텀 에디터**를 개선하려고 한다.
현재 가장 큰 문제는 두 가지다.

1. **작성 화면과 게시(노출) 화면이 서로 다르다.** 쓸 때 본 모양과 등록 후 보이는 모양이 달라진다.
2. **저장 시 서식/스타일이 유실된다.** 글자색·굵기·정렬·표·줄바꿈·공백 등이 등록하면 사라지거나 틀어진다.

목표는 **WYSIWYG 일관성**이다. 즉 *작성 화면 = 미리보기 = 게시 화면*이 픽셀 수준으로 동일해야 하고, 사용자가 넣은 서식이 등록 후에도 그대로 보존되어야 한다.

## 기술 스택 (heavyjungle)
- 프론트엔드: **Next.js 15 + React 19 + Tailwind CSS**
- 에디터 코어: **contentEditable 기반 자체 구현** (`PostRichTextEditor`)
- 백엔드/저장: **Node + PostgreSQL (Drizzle)**, 본문은 HTML 문자열로 저장
- 렌더링: **서버 컴포넌트** `PostContent` → `dangerouslySetInnerHTML` + 공통 `.post-content` 클래스
- Sanitize: **DOMPurify allowlist** (`sanitize-post-html-core.ts`)

## 구현 현황

| 요구사항 | 상태 | 구현 위치 |
|---------|------|-----------|
| 작성 = 게시 CSS 공유 | ✅ | `src/lib/post-content-styles.ts` |
| 미리보기 탭 (저장과 동일 sanitize) | ✅ | `post-form.tsx` → `PostContentPreview` |
| allowlist sanitize (서식 보존) | ✅ | `src/lib/sanitize-post-html-core.ts` |
| 등록/수정 후 캐시 무효화 | ✅ | `revalidatePostListPaths()` in `actions.ts` |
| 라운드트립 단위 테스트 | ✅ | `src/lib/sanitize-post-html.test.ts` |

### 저장 파이프라인
```
contentEditable innerHTML
  → hidden input (post-form syncContent)
  → server action createPost / updatePost
  → sanitizePostHtml (DOMPurify allowlist)
  → PostgreSQL posts.content
  → PostContentRenderer (상세) / PostContentPreview (미리보기)
```

## 반드시 지켜야 할 요구사항

### 1. 작성 화면 = 게시 화면 (스타일 일치)
- 에디터 편집 영역과 게시글 노출 영역이 **동일한 CSS 클래스/스타일 시트**를 공유한다. (`postContentProseClass`)
- 편집 중 **미리보기** 탭도 같은 스타일 + 저장과 동일한 sanitize를 사용한다.

### 2. 서식/스타일 유실 방지 (저장·불러오기 라운드트립)
- 허용 서식: 글자색/배경색, 굵기·기울임·밑줄, 글자 크기, 정렬, 목록, 표(병합), 링크, 이미지, 인용, 코드, 연속 공백·줄바꿈
- `whitespace-pre-wrap` + `<br>` / `&nbsp;` 보존
- XSS 위험 요소만 제거 (script, on* 이벤트, javascript: URL 등)

### 3. 등록 후 즉시 반영
- 등록/수정 시 `revalidatePath`로 `/`, `/posts/[id]`, `/notices`(공지) 무효화 후 상세로 redirect

## 완료 기준 (테스트)
다음 케이스가 **작성 → sanitize → 재조회** 후 유지되어야 한다 (`npm run test`).
- [x] 글자색·배경색·굵기·크기·정렬 혼합 문단
- [x] 여러 줄 연속 줄바꿈 + 연속 공백(들여쓰기)
- [x] 순서/비순서 목록(중첩 포함)
- [x] 셀 병합 있는 표
- [x] 이미지(크기·정렬 지정), 링크
- [x] 인용/코드블록
- [ ] 위 전체를 담은 글을 등록 직후 새로고침 없이 상세·목록에서 동일하게 확인 (수동 QA)

## 주의
- sanitize는 유지하되 정상 서식까지 지우지 않는다.
- 미리보기/클라이언트 sanitize는 `NEXT_PUBLIC_S3_PUBLIC_URL`만 사용 (서버 env 노출 금지).
- 변경 후 실제 글 샘플로 회귀 확인할 것.
