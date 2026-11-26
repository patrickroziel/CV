export type ArticlePartDraft = {
  title: string;
  body: string;
};

const PART_HEADING = /<h2\b[^>]*\bair-part-title\b[^>]*>([\s\S]*?)<\/h2>/gi;

function textOf(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => {
    if (char === "&") return "\u0026amp;";
    if (char === "<") return "\u0026lt;";
    if (char === ">") return "\u0026gt;";
    return "\u0026quot;";
  });
}

/** Split a saved article into titled blocks. Text before the first title stays as the opening block. */
export function splitArticleParts(html: string): ArticlePartDraft[] {
  const source = html || "";
  const matches = [...source.matchAll(PART_HEADING)];
  if (!matches.length) return [{ title: "", body: source }];
  const blocks: ArticlePartDraft[] = [];
  const before = source.slice(0, matches[0].index ?? 0).trim();
  if (before) blocks.push({ title: "", body: before });
  matches.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? source.length;
    const title = textOf(match[1] ?? "");
    blocks.push({
      title: title.toLocaleLowerCase("fr") === "titre de la partie" ? "" : title,
      body: source.slice(start, end).trim(),
    });
  });
  return blocks.length ? blocks : [{ title: "", body: "" }];
}

/** Rebuild the HTML the reader already understands. A title is written only when it is filled in. */
export function joinArticleParts(parts: ArticlePartDraft[]) {
  const chunks: string[] = [];
  for (const part of parts) {
    const title = part.title.trim();
    const body = part.body.trim();
    if (!title && !body) continue;
    if (title) chunks.push(`<h2 class="air-part-title">${escapeHtml(title)}</h2>`);
    if (body) chunks.push(body);
  }
  return chunks.join("");
}
