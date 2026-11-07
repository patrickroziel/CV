import { stripHtml } from "@/lib/sanitize-html";

const MEDIA_TOKEN = /\[\[MEDIA:[a-zA-Z0-9_-]{8,80}\]\]/g;

/** Plain lines of a post, wrapped like the Notes column. */
export function firstPostLines(html: string, count = 10, width = 72) {
  const plain = stripHtml(html || "")
    .replace(MEDIA_TOKEN, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
  const rows: string[] = [];
  for (const block of plain.split("\n")) {
    const words = block.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > width && line) {
        rows.push(line);
        if (rows.length >= count) return rows;
        line = word;
      } else {
        line = next;
      }
    }
    if (line) rows.push(line);
    if (rows.length >= count) break;
  }
  return rows.slice(0, count);
}

/** Text sent with a share: the first ten lines, then the invitation to continue. */
export function shareExcerpt(html: string) {
  const lines = firstPostLines(html);
  if (!lines.length) return "";
  return `${lines.join("\n")}\nLire plus...`;
}
