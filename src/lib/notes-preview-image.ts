import type { SocialPost } from "@/lib/types";

/** Public visual source, matching the Notes share-card preference. */
export function getNoteSharePhoto(post: SocialPost): string | null {
  const urls: unknown[] = [post.bookCoverUrl];
  if (post.featuredEmbed?.type === "image") urls.push(post.featuredEmbed.url);
  if (post.fileKind === "image") urls.push(post.fileUrl);
  for (const item of post.inlineMedia ?? []) {
    if (item.type === "image") urls.push(item.url);
    if (item.type === "carousel") urls.push(...item.items.filter(x => x.type === "image").map(x => x.url));
  }
  for (const raw of urls) {
    if (typeof raw !== "string") continue;
    try { const url = new URL(raw); if (url.protocol === "https:") return url.toString(); } catch {}
  }
  return null;
}
