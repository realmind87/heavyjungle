import { isPostHtmlContent } from "@/lib/sanitize-post-html";

type PostContentProps = {
  content: string;
  className?: string;
};

export function PostContent({ content, className = "mt-8" }: PostContentProps) {
  if (isPostHtmlContent(content)) {
    return (
      <div
        className={`${className} text-zinc-800 [&_*]:max-w-full dark:text-zinc-200`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className={`${className} whitespace-pre-wrap text-zinc-800 dark:text-zinc-200`}>{content}</div>
  );
}
