import { getL } from "@/lib/i18n-content";
import { stripHtml } from "@/lib/sanitize-html";
import { isGhostSlug, slugifyGhost } from "@/lib/ghost-href";
import type { GhostPage, Translatable } from "@/lib/types";

export { ghostSlugFromHref, isGhostSlug, slugifyGhost } from "@/lib/ghost-href";

export function ghostExcerpt(value: Translatable | string, max = 200): string {
  const html = typeof value === "string" ? value : getL(value, "fr");
  const text = stripHtml(html).replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > 80 ? cut.slice(0, space) : cut).trim()}…`;
}

export function normalizeGhostPages(raw: unknown): GhostPage[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const pages: GhostPage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const source = item as Partial<GhostPage>;
    const slug = slugifyGhost(typeof source.slug === "string" ? source.slug : "");
    if (!isGhostSlug(slug) || seen.has(slug)) continue;
    const id = typeof source.id === "string" && source.id.trim() ? source.id.trim().slice(0, 80) : slug;
    const title = typeof source.title === "string" ? source.title.slice(0, 180) : "";
    const body = typeof source.body === "string" || (source.body && typeof source.body === "object")
      ? source.body
      : "";
    seen.add(slug);
    pages.push({
      id,
      slug,
      title,
      body,
      visible: source.visible !== false,
      updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : new Date(0).toISOString(),
    });
  }
  return pages;
}
