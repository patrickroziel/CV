import type { SocialPost } from "@/lib/types";

function chapterRank(post: SocialPost): number | null {
  return typeof post.chapterOrder === "number" && Number.isFinite(post.chapterOrder)
    ? post.chapterOrder
    : null;
}

/** Numbered chapters first (0, then 1…). Unnumbered chapters keep their previous order. */
export function compareBookChapters(a: SocialPost, b: SocialPost) {
  const left = chapterRank(a);
  const right = chapterRank(b);
  if (left != null && right != null && left !== right) return left - right;
  if (left != null && right == null) return -1;
  if (left == null && right != null) return 1;
  if (a.order !== b.order) return a.order - b.order;
  return (a.date || "").localeCompare(b.date || "");
}
