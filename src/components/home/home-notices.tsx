import Link from "next/link";
import type { NoticeListItem } from "@/features/posts/queries";

type HomeNoticesProps = {
  notices: NoticeListItem[];
};

function NoticeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  );
}

function formatNoticeDate(date: Date) {
  return date
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}

/** 홈 공지사항 — 관리자가 등록한 공지 최대 5개 */
export function HomeNotices({ notices }: HomeNoticesProps) {
  return (
    <section
      aria-label="공지사항"
      className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-1 flex items-center justify-between gap-2 px-3 pb-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          공지사항
        </p>
        <Link
          href="/notices"
          className="shrink-0 text-xs font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          전체보기
        </Link>
      </div>

      {notices.length === 0 ? (
        <p className="px-3 py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          등록된 공지사항이 없습니다.
        </p>
      ) : (
        <ul className="space-y-1">
          {notices.map((notice) => (
            <li key={notice.id}>
              <Link
                href={`/posts/${notice.id}`}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <span className="mt-0.5 shrink-0 text-zinc-500 dark:text-zinc-400">
                  <NoticeIcon />
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-sm font-medium">{notice.title}</span>
                  <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                    {formatNoticeDate(notice.createdAt)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
