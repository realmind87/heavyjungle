import { NextResponse } from "next/server";
import { toggleLike } from "@/features/likes/actions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** 좋아요 토글 — fetch 전용 (서버 액션 호출 시 RSC 재렌더·조회수 중복 증가 방지) */
export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await toggleLike(id);

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
