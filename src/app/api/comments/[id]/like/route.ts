import { NextResponse } from "next/server";
import { toggleCommentLike } from "@/features/comments/like-actions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** 댓글 좋아요 토글 — fetch 전용 (서버 액션 호출 시 RSC 재렌더 방지) */
export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await toggleCommentLike(id);

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
