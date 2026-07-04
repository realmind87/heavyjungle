import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { posts, users } from "@/server/db/schema";

const SITEMAP_POST_LIMIT = 1000;
const SITEMAP_USER_LIMIT = 500;

export async function listSitemapPosts() {
  return db
    .select({ id: posts.id, updatedAt: posts.updatedAt })
    .from(posts)
    .where(eq(posts.isDeleted, false))
    .orderBy(desc(posts.updatedAt))
    .limit(SITEMAP_POST_LIMIT);
}

export async function listSitemapUsers() {
  return db
    .select({ username: users.username, updatedAt: users.updatedAt })
    .from(users)
    .orderBy(desc(users.updatedAt))
    .limit(SITEMAP_USER_LIMIT);
}
