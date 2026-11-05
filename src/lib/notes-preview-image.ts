import type { SocialPost } from "@/lib/types";

function readableMediaUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    const host = url.hostname;
    const onBlob = host === "blob.vercel-storage.com" || host.endsWith(".blob.vercel-storage.com");
    if (onBlob) return `/api/media/blob?url=${encodeURIComponent(url.toString())}`;
    return url.toString();
  } catch {
    return null;
  }
}

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
    const readable = readableMediaUrl(raw);
    if (readable) return readable;
  }
  return null;
}
