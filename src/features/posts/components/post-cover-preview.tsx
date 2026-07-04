import type { PostCoverType } from "@/lib/post-cover-image";
import { RemoteImage } from "@/components/ui/remote-image";

type PostCoverPreviewProps = {
  coverImageUrl: string | null;
  coverType: PostCoverType | null;
  className?: string;
};

function VideoIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m17 10 4-2v8l-4-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 4 3-4 3z" />
    </svg>
  );
}

/** 글 본문 대표 이미지/영상 미리보기 */
export function PostCoverPreview({ coverImageUrl, coverType, className = "" }: PostCoverPreviewProps) {
  if (!coverType) return null;

  if (coverImageUrl) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <RemoteImage
          src={coverImageUrl}
          alt=""
          fill
          sizes="(max-width: 768px) 50vw, 320px"
          className="object-cover"
        />
      </div>
    );
  }

  if (coverType === "video" || coverType === "youtube") {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-zinc-800/80 dark:text-zinc-500 ${className}`}
        aria-hidden="true"
      >
        <VideoIcon />
      </div>
    );
  }

  return null;
}

export function hasPostCoverMedia(coverType: PostCoverType | null): boolean {
  return coverType !== null;
}
