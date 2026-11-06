import type { SocialPost, SocialPostCoverSource } from "@/lib/types";

export function isTeaserPost(post: { contentHidden?: boolean | null }): boolean {
  return post.contentHidden === true;
}

export function isWipCover(post: { coverSource?: SocialPostCoverSource | null }): boolean {
  return post.coverSource === "wip";
}

/** Cover actually shown. A work-in-progress cover has no image URL. */
export function visibleCoverUrl(post: {
  coverSource?: SocialPostCoverSource | null;
  bookCoverUrl?: string | null;
}): string | null {
  if (post.coverSource === "wip") return null;
  const url = typeof post.bookCoverUrl === "string" ? post.bookCoverUrl.trim() : "";
  return url || null;
}

export const TEASER_PUBLIC_LINE = "Work in progress — le texte de cet article n’est pas encore visible.";

/**
 * Public copies must not carry the unpublished body, inline media or files.
 * Title, subtitle, cover and the teaser flag stay.
 */
export function concealHiddenPost<T extends SocialPost>(post: T): T {
  if (!isTeaserPost(post)) return post;
  return {
    ...post,
    description: typeof post.description === "string" ? "" : {},
    youtubeUrl: null,
    featuredEmbed: null,
    inlineMedia: [],
    fileUrl: null,
    fileKind: null,
    fileName: null,
    bookPdfUrl: null,
    bookPdfName: null,
  };
}
