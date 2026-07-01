import { isPostHtmlContent } from "@/lib/sanitize-post-html";

type PostContentProps = {
  content: string;
  className?: string;
};

export function PostContent({ content, className = "mt-8" }: PostContentProps) {
  if (isPostHtmlContent(content)) {
    return (
      <div
        className={`${className} text-base text-zinc-800 dark:text-zinc-200 [&_b]:font-bold [&_div]:min-h-[1.5em] [&_em]:italic [&_i]:italic [&_strong]:font-bold`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className={`${className} whitespace-pre-wrap text-zinc-800 dark:text-zinc-200`}>{content}</div>
  );
}
