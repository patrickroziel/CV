import type { MetadataRoute } from "next";
import { listPublicPosts, NOTES_ORIGIN } from "@/lib/server/notes-sharing";

export const runtime = "nodejs";
export const revalidate = 300;

function lastModified(date: string | undefined) {
  if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) return undefined;
  const parsed = new Date(date.length === 10 ? `${date}T12:00:00.000Z` : date);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await listPublicPosts();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${NOTES_ORIGIN}/`, changeFrequency: "daily", priority: 1 },
    { url: `${NOTES_ORIGIN}/air`, changeFrequency: "daily", priority: 0.9 },
    { url: `${NOTES_ORIGIN}/work`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${NOTES_ORIGIN}/projets`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const articles: MetadataRoute.Sitemap = posts.map((post) => {
    const universe = post.universe === "air" ? "air" : "notes";
    return {
      url: `${NOTES_ORIGIN}/${universe}/${post.id}`,
      lastModified: lastModified(post.date),
      changeFrequency: "weekly",
      priority: universe === "air" ? 0.7 : 0.8,
    };
  });

  return [...staticPages, ...articles];
}
