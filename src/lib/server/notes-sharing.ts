import "server-only";

import { cache } from "react";
import { DEFAULT_PORTFOLIO } from "@/lib/defaults";
import { getL } from "@/lib/i18n-content";
import { stripHtml } from "@/lib/sanitize-html";
import { readPortfolio } from "@/lib/server/portfolio-db";
import type { SocialPost } from "@/lib/types";
import { coercePostCategory } from "@/lib/post-taxonomy";

export const NOTES_ORIGIN = "https://patrickroziel.com";

const isPostId = (id: string) => /^[a-zA-Z0-9_-]{1,128}$/.test(id);

/**
 * Social crawlers do not run our client-side PortfolioProvider.
 * Read the current cloud snapshot on the server, without ever disclosing drafts.
 */
export const listPublicPosts = cache(async function listPublicPosts(): Promise<SocialPost[]> {
  let posts = DEFAULT_PORTFOLIO.socialPosts ?? [];
  try {
    const saved = await readPortfolio();
    if (saved.data?.socialPosts) posts = saved.data.socialPosts;
  } catch {
    // The baked-in public snapshot remains a fallback if Neon is unavailable.
  }
  return posts
    .filter((post) => post.visible !== false)
    .map((post) => {
      const category = coercePostCategory(post);
      return category === post.category ? post : { ...post, category };
    });
});

export async function getPublicNote(id: string): Promise<SocialPost | null> {
  if (!isPostId(id)) return null;
  const posts = await listPublicPosts();
  return posts.find((post) => post.id === id) ?? null;
}

function validPublicImage(url: unknown): string | null {
  if (typeof url !== "string" || url.length > 2048) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password ||
        !parsed.hostname.includes(".")) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Prefer the actual cover, then the first photo supplied by the author. */
export function getNoteSharePhoto(post: SocialPost): string | null {
  const options: unknown[] = [post.bookCoverUrl];
  if (post.featuredEmbed?.type === "image") options.push(post.featuredEmbed.url);
  if (post.fileKind === "image") options.push(post.fileUrl);
  for (const item of post.inlineMedia ?? []) {
    if (item.type === "image") options.push(item.url);
    if (item.type === "carousel") {
      options.push(...item.items.filter((media) => media.type === "image").map((media) => media.url));
    }
  }
  for (const option of options) {
    const image = validPublicImage(option);
    if (image) return image;
  }
  return null;
}

export function titleForSearch(title: string) {
  return title.replace(/^(?:\p{Extended_Pictographic}\uFE0F?\s*)+/u, "").trim() || title;
}

export function getNoteShareText(post: SocialPost) {
  const title = stripHtml(getL(post.title, "fr")).replace(/\s+/g, " ").trim().slice(0, 130) || "Notes de Patrick Roziel";
  const raw = stripHtml(getL(post.description, "fr"))
    .replace(/\[\[MEDIA:[a-zA-Z0-9_-]{8,80}\]\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const summary = raw.slice(0, 190).trimEnd();
  const description = (summary.length ? (raw.length > 190 ? summary + "…" : summary) :
    (post.subtitle ? stripHtml(getL(post.subtitle, "fr")).replace(/\s+/g, " ").trim().slice(0, 190) : "")) ||
    "Une publication de Patrick Roziel, dans Notes.";
  return { title, description };
}
