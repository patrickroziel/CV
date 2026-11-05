import "server-only";

import { cache } from "react";
import { ghostExcerpt, isGhostSlug, normalizeGhostPages } from "@/lib/ghost-pages";
import { getL } from "@/lib/i18n-content";
import { readPublicPortfolio } from "@/lib/server/portfolio-db";
import type { GhostPage } from "@/lib/types";

export const listPublicGhosts = cache(async function listPublicGhosts(): Promise<GhostPage[]> {
  try {
    const saved = await readPublicPortfolio();
    return normalizeGhostPages(saved.data?.ghostPages).filter((page) => page.visible);
  } catch {
    return [];
  }
});

export async function getPublicGhost(slug: string): Promise<GhostPage | null> {
  if (!isGhostSlug(slug)) return null;
  const pages = await listPublicGhosts();
  return pages.find((page) => page.slug === slug) ?? null;
}

export function ghostShareText(page: GhostPage): { title: string; description: string } {
  const title = page.title.trim() || "Sans titre";
  const description = ghostExcerpt(getL(page.body, "fr"), 180) || "Patrick Roziel";
  return { title, description };
}
