import type { ComponentPropsWithoutRef } from "react";

export const postMetaChipClass =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full border border-zinc-200 px-2.5 text-sm leading-none text-zinc-500 dark:border-zinc-700 dark:text-zinc-400";

export const postMetaIconOnlyChipClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400";

type PostMetaChipProps = ComponentPropsWithoutRef<"span">;

export function PostMetaChip({ className = "", children, ...props }: PostMetaChipProps) {
  return (
    <span className={`${postMetaChipClass} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
