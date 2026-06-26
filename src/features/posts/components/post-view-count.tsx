"use client";

import { useEffect, useRef, useState } from "react";
import { PostMetaChip } from "@/components/posts/post-meta-chip";

type PostViewCountProps = {
  postId: string;
  initialViewCount: number;
};

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** 상세 진입 시 조회수 집계 — API Route로 1회만 호출 */
export function PostViewCount({ postId, initialViewCount }: PostViewCountProps) {
  const [viewCount, setViewCount] = useState(initialViewCount);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;

    fetch(`/api/posts/${postId}/view`, { method: "POST" })
      .then((response) => response.json())
      .then((data: { viewCount?: number }) => {
        if (typeof data.viewCount === "number") {
          setViewCount(data.viewCount);
        }
      })
      .catch(() => {
        // 집계 실패 시 서버에서 받은 초기값 유지
      });
  }, [postId]);

  return (
    <PostMetaChip aria-label={`조회 ${viewCount}`}>
      <EyeIcon />
      {viewCount}
    </PostMetaChip>
  );
}
