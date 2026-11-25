export type ArticlePartDraft = {
  title: string;
  body: string;
};

const PART_HEADING = /<h2\b[^>]*\bair-part-title\b[^>]*>([\s\S]*?)<\/h2>/gi;

function textOf(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">");
}

/** Split a saved article into the opening text and the framed parts. */
export function splitArticleParts(html: string): { intro: string; parts: ArticlePartDraft[] } {
  const source = html || "";
  const matches = [...source.matchAll(PART_HEADING)];
  if (!matches.length) return { intro: source, parts: [] };
  const parts = matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? source.length;
    const title = textOf(match[1] ?? "");
    return {
      title: title.toLocaleLowerCase("fr") === "titre de la partie" ? "" : title,
      body: source.slice(start, end).trim(),
    };
  });
  return { intro: source.slice(0, matches[0].index ?? 0).trim(), parts };
}

/** Rebuild the HTML the reader already understands. */
export function joinArticleParts(intro: string, parts: ArticlePartDraft[]) {
  const chunks = [intro.trim()].filter(Boolean);
  for (const part of parts) {
    const title = part.title.trim();
    const body = part.body.trim();
    if (!title && !body) continue;
    chunks.push(`<h2 class="air-part-title">${escapeHtml(title || "Titre de la partie")}</h2>`);
    if (body) chunks.push(body);
  }
  return chunks.join("");
}
