import { NextResponse } from "next/server";
import { getPostsPage, POSTS_PAGE_SIZE, POSTS_TOTAL } from "@/lib/posts";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = Number(searchParams.get("start") ?? 0);
    const limit = Number(searchParams.get("limit") ?? POSTS_PAGE_SIZE);

    if (!Number.isInteger(start) || start < 0 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
      return NextResponse.json({ error: "Invalid pagination" }, { status: 400 });
    }

    const posts = await getPostsPage(start, limit);

    return NextResponse.json({
      posts,
      hasMore: start + posts.length < POSTS_TOTAL,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
