import { and, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPostById } from "@/features/posts/queries";
import { db } from "@/server/db";
import { posts } from "@/server/db/schema";

const VIEWED_POST_COOKIE_PREFIX = "post_viewed_";
const VIEWED_POST_MAX_AGE = 60 * 60 * 24;

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** 조회수 +1 — 쿠키로 동일 글 중복 집계 방지 */
export async function POST(_request: Request, context: RouteContext) {
  const { id: postId } = await context.params;
  const post = await getPostById(postId);

  if (!post || post.isDeleted) {
    return NextResponse.json({ error: "글을 찾을 수 없습니다." }, { status: 404 });
  }

  const cookieStore = await cookies();
  const cookieName = `${VIEWED_POST_COOKIE_PREFIX}${postId}`;

  if (cookieStore.get(cookieName)) {
    return NextResponse.json({ viewCount: post.viewCount });
  }

  await db
    .update(posts)
    .set({ viewCount: sql`view_count + 1` })
    .where(and(eq(posts.id, postId), eq(posts.isDeleted, false)));

  cookieStore.set(cookieName, "1", {
    maxAge: VIEWED_POST_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({ viewCount: post.viewCount + 1 });
}
