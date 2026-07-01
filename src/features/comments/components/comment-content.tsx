import { isCommentHtmlContent, stripCommentNbsp } from "@/lib/sanitize-comment-html";

type CommentContentProps = {
  content: string;
  isDeleted: boolean;
  className?: string;
};

export function CommentContent({ content, isDeleted, className = "" }: CommentContentProps) {
  if (isDeleted) {
    return (
      <p className={`whitespace-pre-wrap text-sm italic text-zinc-400 dark:text-zinc-500 ${className}`}>
        {content}
      </p>
    );
  }

  if (isCommentHtmlContent(content)) {
    return (
      <div
        className={`text-sm text-zinc-900 dark:text-zinc-100 [&_a]:break-all [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400 [&_img]:my-1 [&_img]:max-h-64 [&_img]:max-w-full [&_img]:rounded-md ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <p className={`whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-100 ${className}`}>
      {stripCommentNbsp(content)}
    </p>
  );
}
