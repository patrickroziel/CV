/**
 * Fetch a public X/Twitter profile timeline without official widgets.js
 * (often empty / blocked for many accounts).
 *
 * Strategy:
 * 1) Official syndication embed JSON (works for some public accounts)
 * 2) Scrape status IDs from x.com profile HTML + hydrate via fxtwitter
 * 3) Always try fxtwitter for user card (avatar, bio, stats)
 */

export type XTimelineTweet = {
  id: string;
  text: string;
  url: string;
  createdAt?: string | null;
  likes?: number | null;
  retweets?: number | null;
  replies?: number | null;
  authorName?: string | null;
  authorHandle?: string | null;
  authorAvatar?: string | null;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | null;
  pinned?: boolean;
};

export type XTimelineUser = {
  name: string;
  screenName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  followers: number | null;
  following: number | null;
  tweets: number | null;
  url: string;
  verified?: boolean;
};

export type XTimelineResult = {
  user: XTimelineUser | null;
  tweets: XTimelineTweet[];
  source: "syndication" | "scrape+fxtwitter" | "mixed" | "none";
  error?: string;
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function cleanHandle(input: string): string | null {
  const raw = input.trim().replace(/^@/, "");
  if (!raw) return null;
  // bare handle
  if (/^[\w]{1,15}$/i.test(raw)) return raw;
  try {
    const withProto = raw.includes("://") ? raw : `https://${raw}`;
    const u = new URL(withProto);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (
      !host.endsWith("x.com") &&
      !host.endsWith("twitter.com") &&
      !host.endsWith("mobile.twitter.com")
    ) {
      return null;
    }
    const part = u.pathname.split("/").filter(Boolean)[0];
    if (!part || ["i", "intent", "share", "home", "explore"].includes(part)) {
      return null;
    }
    return part.replace(/[^\w]/g, "") || null;
  } catch {
    return null;
  }
}

async function fetchFxUser(screen: string): Promise<XTimelineUser | null> {
  try {
    const res = await fetch(`https://api.fxtwitter.com/${encodeURIComponent(screen)}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      code?: number;
      user?: {
        screen_name?: string;
        name?: string;
        description?: string;
        avatar_url?: string;
        banner_url?: string;
        followers?: number;
        following?: number;
        tweets?: number;
        url?: string;
        verification?: { verified?: boolean };
      };
    };
    const u = data.user;
    if (!u?.screen_name) return null;
    return {
      name: u.name || u.screen_name,
      screenName: u.screen_name,
      avatarUrl: u.avatar_url?.replace("_normal", "_bigger") || null,
      bannerUrl: u.banner_url || null,
      description: u.description || null,
      followers: typeof u.followers === "number" ? u.followers : null,
      following: typeof u.following === "number" ? u.following : null,
      tweets: typeof u.tweets === "number" ? u.tweets : null,
      url: u.url || `https://x.com/${u.screen_name}`,
      verified: Boolean(u.verification?.verified),
    };
  } catch {
    return null;
  }
}

type FxTweet = {
  id?: string;
  text?: string;
  url?: string;
  created_at?: string;
  created_timestamp?: number;
  likes?: number;
  retweets?: number;
  replies?: number;
  author?: {
    name?: string;
    screen_name?: string;
    avatar_url?: string;
  };
  media?: {
    photos?: Array<{ url?: string }>;
    videos?: Array<{ url?: string; thumbnail_url?: string }>;
    all?: Array<{ type?: string; url?: string; thumbnail_url?: string }>;
  };
};

async function fetchFxTweet(id: string): Promise<XTimelineTweet | null> {
  try {
    const res = await fetch(`https://api.fxtwitter.com/status/${id}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { code?: number; tweet?: FxTweet };
    const tw = data.tweet;
    if (!tw?.id) return null;

    let mediaUrl: string | null = null;
    let mediaType: "image" | "video" | null = null;
    const video = tw.media?.videos?.[0];
    const photo = tw.media?.photos?.[0];
    if (video?.thumbnail_url || video?.url) {
      mediaUrl = video.thumbnail_url || video.url || null;
      mediaType = "video";
    } else if (photo?.url) {
      mediaUrl = photo.url;
      mediaType = "image";
    } else if (tw.media?.all?.[0]) {
      const m = tw.media.all[0];
      mediaUrl = m.thumbnail_url || m.url || null;
      mediaType = m.type === "video" || m.type === "gif" ? "video" : "image";
    }

    return {
      id: String(tw.id),
      text: (tw.text || "").trim(),
      url: tw.url || `https://x.com/i/status/${tw.id}`,
      createdAt: tw.created_at || null,
      likes: typeof tw.likes === "number" ? tw.likes : null,
      retweets: typeof tw.retweets === "number" ? tw.retweets : null,
      replies: typeof tw.replies === "number" ? tw.replies : null,
      authorName: tw.author?.name || null,
      authorHandle: tw.author?.screen_name || null,
      authorAvatar: tw.author?.avatar_url || null,
      mediaUrl,
      mediaType,
    };
  } catch {
    return null;
  }
}

/** Official syndication embed (empty for some accounts / sensitive media). */
async function fromSyndication(screen: string): Promise<XTimelineTweet[]> {
  try {
    const url =
      `https://syndication.twitter.com/srv/timeline-profile/screen-name/${encodeURIComponent(screen)}` +
      `?dnt=true&embedId=twitter-widget-0&frame=false&hideBorder=true&hideFooter=true` +
      `&hideHeader=true&hideScrollBar=false&lang=en&maxHeight=2000&showReplies=false&transparent=true&theme=dark`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 180 },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const m = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/
    );
    if (!m?.[1]) return [];
    const data = JSON.parse(m[1]) as {
      props?: {
        pageProps?: {
          timeline?: {
            entries?: Array<{
              type?: string;
              entry_id?: string;
              content?: {
                tweet?: {
                  id_str?: string;
                  full_text?: string;
                  text?: string;
                  created_at?: string;
                  favorite_count?: number;
                  retweet_count?: number;
                  reply_count?: number;
                  permalink?: string;
                  user?: {
                    name?: string;
                    screen_name?: string;
                    profile_image_url_https?: string;
                  };
                  entities?: {
                    media?: Array<{
                      media_url_https?: string;
                      type?: string;
                    }>;
                  };
                };
              };
            }>;
          };
        };
      };
    };
    const entries = data.props?.pageProps?.timeline?.entries ?? [];
    const out: XTimelineTweet[] = [];
    for (const entry of entries) {
      const tw = entry.content?.tweet;
      if (!tw) continue;
      const id =
        tw.id_str ||
        (entry.entry_id || "").replace(/^tweet-/, "") ||
        "";
      if (!id) continue;
      const media = tw.entities?.media?.[0];
      out.push({
        id,
        text: (tw.full_text || tw.text || "").trim(),
        url:
          tw.permalink?.startsWith("http")
            ? tw.permalink
            : `https://x.com/${tw.user?.screen_name || screen}/status/${id}`,
        createdAt: tw.created_at || null,
        likes: tw.favorite_count ?? null,
        retweets: tw.retweet_count ?? null,
        replies: tw.reply_count ?? null,
        authorName: tw.user?.name || null,
        authorHandle: tw.user?.screen_name || null,
        authorAvatar: tw.user?.profile_image_url_https || null,
        mediaUrl: media?.media_url_https || null,
        mediaType: media?.type === "video" || media?.type === "animated_gif"
          ? "video"
          : media
            ? "image"
            : null,
        pinned: (entry.entry_id || "").includes("pin") || false,
      });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Pull ordered status IDs belonging to `screen` from public profile HTML.
 * X often embeds article/meta markup even when APIs return empty timelines.
 */
async function scrapeProfileStatusIds(
  screen: string
): Promise<{ ids: string[]; pinnedId: string | null }> {
  try {
    const res = await fetch(`https://x.com/${encodeURIComponent(screen)}`, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
      },
      next: { revalidate: 120 },
    });
    if (!res.ok) return { ids: [], pinnedId: null };
    const html = await res.text();

    // Prefer posts authored by this screen name
    const reOwn = new RegExp(
      `/(?:${screen})/status/(\\d{10,})`,
      "gi"
    );
    const ordered: string[] = [];
    const seen = new Set<string>();
    for (const m of html.matchAll(reOwn)) {
      const id = m[1];
      if (seen.has(id)) continue;
      seen.add(id);
      ordered.push(id);
    }

    // Pin marker near TweetResults
    let pinnedId: string | null = null;
    const pinMatch = html.match(
      /TimelineGeneralContext[^]{0,200}?context_type":"Pin"[^]{0,120}?tweet-(\d{10,})/i
    );
    if (pinMatch?.[1]) pinnedId = pinMatch[1];
    const pinMatch2 = html.match(
      /"context_type":"Pin"[^]{0,300}?"TweetResults:(\d{10,})"/
    );
    if (!pinnedId && pinMatch2?.[1]) pinnedId = pinMatch2[1];

    // Fallback: any /status/ ids (may include quoted authors)
    if (ordered.length === 0) {
      for (const m of html.matchAll(/\/status(?:es)?\/(\d{10,})/g)) {
        const id = m[1];
        if (seen.has(id)) continue;
        seen.add(id);
        ordered.push(id);
      }
    }

    return { ids: ordered.slice(0, 12), pinnedId };
  } catch {
    return { ids: [], pinnedId: null };
  }
}

async function hydrateIds(
  ids: string[],
  pinnedId: string | null
): Promise<XTimelineTweet[]> {
  const unique = [...new Set(ids)].slice(0, 10);
  const results = await Promise.all(unique.map((id) => fetchFxTweet(id)));
  return results
    .filter((t): t is XTimelineTweet => Boolean(t && t.text !== undefined))
    .map((t) => ({
      ...t,
      pinned: pinnedId ? t.id === pinnedId : Boolean(t.pinned),
    }));
}

/** Public entry — used by /api/x/timeline */
export async function fetchXTimeline(
  usernameOrUrl: string
): Promise<XTimelineResult> {
  const screen = cleanHandle(usernameOrUrl);
  if (!screen) {
    return {
      user: null,
      tweets: [],
      source: "none",
      error: "Nom d’utilisateur X invalide",
    };
  }

  const [user, syndicated] = await Promise.all([
    fetchFxUser(screen),
    fromSyndication(screen),
  ]);

  if (syndicated.length > 0) {
    return {
      user,
      tweets: syndicated.slice(0, 10),
      source: "syndication",
    };
  }

  // Syndication empty (common) → scrape profile + fxtwitter hydrate
  const { ids, pinnedId } = await scrapeProfileStatusIds(screen);
  if (ids.length === 0) {
    return {
      user,
      tweets: [],
      source: user ? "none" : "none",
      error: user
        ? "Aucun post public récupérable pour le moment (X bloque l’embed)."
        : "Profil X introuvable",
    };
  }

  const hydrated = await hydrateIds(ids, pinnedId);
  // Drop empty quote shells without text/media
  const tweets = hydrated.filter(
    (t) => Boolean(t.text?.trim()) || Boolean(t.mediaUrl)
  );
  // Prefer pinned first
  tweets.sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));

  return {
    user,
    tweets,
    source: tweets.length ? "scrape+fxtwitter" : "none",
    error:
      tweets.length === 0
        ? "Posts trouvés mais non hydratables (réseau / rate-limit)."
        : undefined,
  };
}
