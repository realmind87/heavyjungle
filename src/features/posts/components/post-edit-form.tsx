import { PostForm } from "@/features/posts/components/post-form";

type PostEditFormProps = {
  postId: string;
  initialTitle: string;
  initialContent: string;
};

/** @deprecated PostForm mode="edit" 사용 */
export function PostEditForm({ postId, initialTitle, initialContent }: PostEditFormProps) {
  return (
    <PostForm
      mode="edit"
      postId={postId}
      initialTitle={initialTitle}
      initialContent={initialContent}
    />
  );
}
