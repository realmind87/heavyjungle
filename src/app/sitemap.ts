import type { MetadataRoute } from "next";
import { listSitemapPosts, listSitemapUsers } from "@/features/sitemap/queries";
import { absoluteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [postRows, userRows] = await Promise.all([listSitemapPosts(), listSitemapUsers()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: absoluteUrl("/notices"), lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  const postRoutes: MetadataRoute.Sitemap = postRows.map((row) => ({
    url: absoluteUrl(`/posts/${row.id}`),
    lastModified: row.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const userRoutes: MetadataRoute.Sitemap = userRows.map((row) => ({
    url: absoluteUrl(`/u/${row.username}`),
    lastModified: row.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...postRoutes, ...userRoutes];
}
