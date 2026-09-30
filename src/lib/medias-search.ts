import { LOCALES } from "@/i18n/locales";
import { getL } from "@/lib/i18n-content";
import { stripHtml } from "@/lib/sanitize-html";
import type { SocialPost } from "@/lib/types";

export type MediasKindFilter = "all" | "video" | "document" | "image";

export function foldSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function postHasVideo(post: SocialPost): boolean {
  return Boolean(post.youtubeUrl?.trim());
}

export function postHasDocument(post: SocialPost): boolean {
  return Boolean(post.fileUrl && post.fileKind === "pdf");
}

export function postHasImage(post: SocialPost): boolean {
  return Boolean(post.fileUrl && post.fileKind === "image");
}

export function postMatchesKind(
  post: SocialPost,
  kind: MediasKindFilter
): boolean {
  if (kind === "all") return true;
  if (kind === "video") return postHasVideo(post);
  if (kind === "document") return postHasDocument(post);
  return postHasImage(post);
}

function typeTokens(post: SocialPost): string[] {
  const tokens: string[] = [];
  if (postHasVideo(post)) {
    tokens.push("video", "videos", "youtube", "short", "shorts", "film", "filme");
  }
  if (postHasDocument(post)) {
    tokens.push("pdf", "document", "documents", "doc", "fichier");
  }
  if (postHasImage(post)) {
    tokens.push("image", "images", "photo", "photos", "img");
  }
  return tokens;
}

/** Haystack used by the live search (all locales + tags + media type). */
export function postSearchHaystack(post: SocialPost): string {
  const parts: string[] = [];
  for (const loc of LOCALES) {
    parts.push(getL(post.title, loc));
    parts.push(stripHtml(getL(post.description, loc)));
  }
  if (post.tags?.length) parts.push(post.tags.join(" "));
  if (post.fileName) parts.push(post.fileName);
  parts.push(...typeTokens(post));
  return foldSearch(parts.join(" "));
}

export function postMatchesQuery(post: SocialPost, query: string): boolean {
  const q = foldSearch(query);
  if (!q) return true;
  const hay = postSearchHaystack(post);
  return q.split(" ").every((token) => hay.includes(token));
}
