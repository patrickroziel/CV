import type { InlinePostMedia } from "@/lib/types";
import { normalizeFeaturedEmbed } from "@/lib/featured-embed";

/** In-band markers survive rich-text sanitization and JSON export/import. */
export function mediaMarker(id: string) { return `[[MEDIA:${id}]]`; }
export const INLINE_MEDIA_ID = /^[a-zA-Z0-9_-]{8,80}$/;
export function normalizeInlinePostMedia(value: unknown): InlinePostMedia[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: InlinePostMedia[] = [];
  for (const raw of value.slice(0, 50)) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const id = item.id;
    if (typeof id !== "string" || !INLINE_MEDIA_ID.test(id) || seen.has(id)) continue;
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
