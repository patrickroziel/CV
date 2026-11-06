export type SiteUniverse = "portfolio" | "medias" | "air";

/** Notes is the public home (redirected from /). Air lives under /air. */
export function universeFromPath(pathname: string | null | undefined): SiteUniverse {
  if (pathname === "/air" || pathname?.startsWith("/air/")) return "air";
  if (pathname === "/work" || pathname?.startsWith("/work/")) return "portfolio";
  // All individual Notes URLs remain in the Notes universe.
  if (!pathname || pathname === "/notes" ||
      pathname.startsWith("/notes/") || pathname === "/medias" ||
      pathname.startsWith("/medias/")) return "medias";
  return "portfolio";
}
