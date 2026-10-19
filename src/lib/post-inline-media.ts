import type { InlinePostMedia } from "@/lib/types";
import { normalizeFeaturedEmbed } from "@/lib/featured-embed";
import type { MediaItem, MediaItemType } from "@/lib/types";

/** In-band markers survive rich-text sanitization and JSON export/import. */
export function mediaMarker(id: string) { return `[[MEDIA:${id}]]`; }
export const INLINE_MEDIA_ID = /^[a-zA-Z0-9_-]{8,80}$/;
const MAX_CAROUSEL_ITEMS = 24;

/** Limit gallery URLs to supported kinds and the same media sources as Work. */
export function normalizeInlineCarouselItems(value: unknown): MediaItem[] {
  if (!Array.isArray(value)) return [];
  const unique = new Set<string>();
  const items: MediaItem[] = [];
  for (const raw of value.slice(0, MAX_CAROUSEL_ITEMS)) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    if (typeof item.id !== "string" || !INLINE_MEDIA_ID.test(item.id) || unique.has(item.id)) continue;
    const type = item.type;
    let url: string | null = null;
    if (type === "image" || type === "youtube" || type === "x") {
      url = normalizeFeaturedEmbed(item)?.url ?? null;
    } else if (type === "file" && typeof item.url === "string") {
      try {
        const parsed = new URL(item.url);
        const host = parsed.hostname.toLowerCase();
        if (parsed.protocol === "https:" && !parsed.username && !parsed.password &&
            (host.endsWith(".public.blob.vercel-storage.com") ||
              host === "res.cloudinary.com")) {
          url = parsed.toString();
        }
      } catch { /* invalid URL */ }
    }
    if (!url) continue;
    const caption = typeof item.caption === "string" ? item.caption.slice(0, 200) : undefined;
    items.push({
      id: item.id,
      type: type as MediaItemType,
      url,
      ...(caption ? { caption } : {}),
    });
    unique.add(item.id);
  }
  return items;
}
export function normalizeInlinePostMedia(value: unknown): InlinePostMedia[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: InlinePostMedia[] = [];
  for (const raw of value.slice(0, 50)) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const id = item.id;
    if (typeof id !== "string" || !INLINE_MEDIA_ID.test(id) || seen.has(id)) continue;
    if (item.type === "carousel") {
      const entries = normalizeInlineCarouselItems(item.items);
      if (!entries.length) continue;
      result.push({
        id, type: "carousel",
        title: typeof item.title === "string" ? item.title.trim().slice(0, 160) : "",
        items: entries,
      });
      seen.add(id);
      continue;
    }
    if (item.type === "text") {
      // Store text, not HTML: React renders it escaped and preserves line breaks.
      const title = typeof item.title === "string" ? item.title.trim().slice(0, 160) : "";
      const body = typeof item.body === "string"
        ? item.body.replace(/\r\n?/g, "\n").slice(0, 40000)
        : "";
      if (!body.trim()) continue;
      result.push({ id, type: "text", title, body, ...(item.format === "rich" ? { format: "rich" as const } : {}) });
      seen.add(id);
      continue;
    }
    const media = normalizeFeaturedEmbed(item);
    if (!media) continue;
    result.push({ id, ...media });
    seen.add(id);
  }
  return result;
}
/** Removes a media block after the author deletes it from the media list. */
export function removeInlineMediaMarker(html: string, id: string) {
  if (!INLINE_MEDIA_ID.test(id)) return html;
  const escaped = mediaMarker(id);
  return html.replaceAll(`<p>${escaped}</p>`, "").replaceAll(escaped, "");
}
