export type SiteUniverse = "portfolio" | "medias" | "air";

/** Notes is the public home. Work and Air use their own routes. */
export function universeFromPath(pathname: string | null | undefined): SiteUniverse {
  if (pathname === "/air" || pathname?.startsWith("/air/")) return "air";
  if (pathname === "/work" || pathname?.startsWith("/work/")) return "portfolio";
  // All individual Notes URLs remain in the Notes universe.
  if (!pathname || pathname === "/" || pathname === "/notes" ||
      pathname.startsWith("/notes/") || pathname === "/medias" ||
      pathname.startsWith("/medias/")) return "medias";
  return "portfolio";
}
