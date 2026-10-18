import type { FeaturedEmbed } from "@/lib/types";

/** Only allow known embeds. Never render arbitrary HTML/iframe supplied by authors. */
export function normalizeFeaturedEmbed(raw: unknown): FeaturedEmbed | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<FeaturedEmbed>;
  if (typeof item.url !== "string" || item.url.length > 2048) return null;
  const url = item.url.trim();
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase();
    if (item.type === "youtube") {
      const youtubeHosts = ["youtube.com","www.youtube.com","m.youtube.com","music.youtube.com","youtube-nocookie.com","www.youtube-nocookie.com","youtu.be","www.youtu.be"];
      if (!youtubeHosts.includes(host)) return null;
      let id = host.endsWith("youtu.be") ? u.pathname.split("/")[1] : u.searchParams.get("v");
      if (!id) id = u.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/)?.[1] ?? null;
      if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
      return { type: "youtube", url: "https://www.youtube.com/watch?v=" + id };
    }
    if (item.type === "x") {
      if (!["x.com","www.x.com","twitter.com","www.twitter.com","mobile.twitter.com"].includes(host)) return null;
      const id = u.pathname.match(/\/status(?:es)?\/(\d{5,25})/)?.[1];
      return id ? { type: "x", url: "https://x.com/i/status/" + id } : null;
    }
    if (item.type === "image") {
      if (u.username || u.password || !host.includes(".")) return null;
      return { type: "image", url: u.toString() };
    }
  } catch { return null; }
  return null;
}
/** Accept a link or copied iframe HTML. Extract only its URL, never persist HTML. */
export function featuredEmbedFromInput(type: FeaturedEmbed["type"], raw: string): FeaturedEmbed | null {
  const input = raw.trim();
  const fromTag = input.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] || "";
  // Some providers wrap a post URL in blockquote markup.
  const candidate = fromTag || input;
  return normalizeFeaturedEmbed({ type, url: candidate.replace(/&amp;/g, "&") });
}
