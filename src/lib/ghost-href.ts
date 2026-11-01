export function slugifyGhost(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isGhostSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 80;
}

const OWN_HOSTS = new Set(["patrickroziel.com", "www.patrickroziel.com"]);

export function ghostSlugFromHref(href: string): string | null {
  try {
    const url = new URL(href);
    const host = url.hostname.toLowerCase();
    const own = OWN_HOSTS.has(host) || host === "localhost" || host === "127.0.0.1";
    if (!own) return null;
    const match = url.pathname.match(/^\/g\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
