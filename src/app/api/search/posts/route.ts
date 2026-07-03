import { NextResponse } from "next/server";
import { searchPostsByTitle } from "@/features/search/queries";

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

    const items = await searchPostsByTitle(q);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "게시글 검색에 실패했습니다." }, { status: 500 });
  }
}
