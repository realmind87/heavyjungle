/** 공통 UI 클래스 — 라이트/다크 모드 일관 스타일 */

export const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-400 dark:focus:ring-zinc-700";

export const textareaClass = `${inputClass} resize-none`;

export const buttonPrimaryClass =
  "rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

export const buttonPrimaryFullClass = `w-full ${buttonPrimaryClass}`;

export const buttonSecondaryClass =
  "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-900";

export const buttonDangerClass =
  "rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950";

export const linkMutedClass =
  "text-sm text-zinc-500 transition hover:underline dark:text-zinc-400";

export const pageTitleClass = "text-2xl font-bold text-zinc-900 dark:text-zinc-50";

export const sectionTitleClass = "text-lg font-semibold text-zinc-900 dark:text-zinc-50";

export const labelClass = "mb-1 block text-sm text-zinc-700 dark:text-zinc-300";

export const labelMediumClass = "text-sm font-medium text-zinc-900 dark:text-zinc-100";

export const mutedTextClass = "text-sm text-zinc-500 dark:text-zinc-400";

export const errorTextClass = "text-sm text-red-600 dark:text-red-400";

export const successTextClass = "text-sm text-green-600 dark:text-green-400";

export const outlineChipClass =
  "inline-block rounded-lg border border-zinc-200 px-4 py-2 text-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900";
