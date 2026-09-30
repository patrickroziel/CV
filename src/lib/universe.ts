export type SiteUniverse = "portfolio" | "medias";

/** Dedicated wallpaper for the Médias universe (studio / film, violet flares). */
export const MEDIAS_BACKGROUND_URL = "/medias-wallpaper.jpg";

/** Resolve the active site universe from a pathname. */
export function universeFromPath(
  pathname: string | null | undefined
): SiteUniverse {
  if (!pathname) return "portfolio";
  if (pathname === "/medias" || pathname.startsWith("/medias/")) {
    return "medias";
  }
  return "portfolio";
}
