export type BookBlock =
  | { type: "html"; html: string }
  | { type: "media"; id: string };

const MEDIA_BLOCK = /<p>\s*\[\[MEDIA:([a-zA-Z0-9_-]{8,80})\]\]\s*<\/p>|\[\[MEDIA:([a-zA-Z0-9_-]{8,80})\]\]/g;

function unwrap(html: string) {
  const trimmed = (html || "").trim();
  const wrapped = trimmed.match(/^<div\b[^>]*\bdata-rich-lh=["'][\d.]+["'][^>]*>([\s\S]*)<\/div>\s*$/i);
  return wrapped ? wrapped[1] : trimmed;
}

function isEmptyHtml(html: string) {
  const text = html
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .trim();
  return !text && !/<img\b/i.test(html);
}

/** Splits a chapter into text and media, and keeps a media that was saved without a marker at the end. */
export function bookBlocks(html: string, mediaIds: string[]): BookBlock[] {
  const source = unwrap(html);
  const blocks: BookBlock[] = [];
  const located = new Set<string>();
  let end = 0;
  for (const match of source.matchAll(MEDIA_BLOCK)) {
    const start = match.index ?? 0;
    const id = match[1] || match[2];
    if (start > end) {
      const part = source.slice(end, start);
      if (!isEmptyHtml(part)) blocks.push({ type: "html", html: part });
    }
    if (id) {
      blocks.push({ type: "media", id });
      located.add(id);
    }
    end = start + match[0].length;
  }
  if (end < source.length) {
    const part = source.slice(end);
    if (!isEmptyHtml(part)) blocks.push({ type: "html", html: part });
  }
  for (const id of mediaIds) {
    if (id && !located.has(id)) blocks.push({ type: "media", id });
  }
  return blocks;
}
