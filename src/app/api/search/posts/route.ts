import { NextResponse } from "next/server";
import { searchPosts } from "@/features/search/queries";
import { getCurrentUser } from "@/server/auth/current-user";

const MAX_LIMIT = 30;
const DEFAULT_LIMIT = 8;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();

    if (!q) {
      return NextResponse.json({ items: [] });
    }

    if (q.length > 100) {
      return NextResponse.json({ error: "검색어가 너무 깁니다." }, { status: 400 });
    }

    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const user = await getCurrentUser();
    const { items, hasMore } = await searchPosts(q, user?.id, { limit, offset });
    return NextResponse.json({ items, hasMore });
  } catch {
    return NextResponse.json({ error: "게시글 검색에 실패했습니다." }, { status: 500 });
  }
}
