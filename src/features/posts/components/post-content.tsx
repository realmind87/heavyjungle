import { isPostHtmlContent } from "@/lib/sanitize-post-html";

type PostContentProps = {
  content: string;
  className?: string;
};

export function PostContent({ content, className = "mt-8" }: PostContentProps) {
  if (isPostHtmlContent(content)) {
    return (
      <div
        className={`${className} text-base text-zinc-800 dark:text-zinc-200 [&_a]:break-all [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400 [&_b]:font-bold [&_div]:min-h-[1.5em] [&_del]:line-through [&_em]:italic [&_i]:italic [&_img]:my-2 [&_img]:max-h-96 [&_img]:max-w-full [&_img]:rounded-lg [&_s]:line-through [&_strike]:line-through [&_strong]:font-bold [&_video]:my-3 [&_video]:max-h-[32rem] [&_video]:max-w-full [&_video]:rounded-lg [&_iframe]:my-3 [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:max-w-full [&_iframe]:rounded-lg`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className={`${className} whitespace-pre-wrap text-zinc-800 dark:text-zinc-200`}>{content}</div>
  );
}
