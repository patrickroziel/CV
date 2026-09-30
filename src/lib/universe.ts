export type SiteUniverse = "portfolio" | "medias";

/** Resolve the active site universe from a pathname. */
export function universeFromPath(
  pathname: string | null | undefined
): SiteUniverse {
  if (!pathname) return "portfolio";
  if (
    pathname === "/notes" ||
    pathname.startsWith("/notes/") ||
    pathname === "/medias" ||
    pathname.startsWith("/medias/")
  ) {
    return "medias";
  }
  return "portfolio";
}
