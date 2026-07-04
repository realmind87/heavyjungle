import { PostContentRenderer } from "@/features/posts/components/post-content-renderer";

type PostContentProps = {
  content: string;
  className?: string;
};

export function PostContent({ content, className = "mt-8" }: PostContentProps) {
  return <PostContentRenderer content={content} className={className} />;
}
