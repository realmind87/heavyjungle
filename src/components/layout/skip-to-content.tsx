import { MAIN_CONTENT_ID } from "@/lib/a11y";

/** 키보드 사용자용 본문 바로가기 — Tab 첫 입력 시 표시 */
export function SkipToContent() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:focus:bg-zinc-100 dark:focus:text-zinc-900"
    >
      본문으로 바로가기
    </a>
  );
}
