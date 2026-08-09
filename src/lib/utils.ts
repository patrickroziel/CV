import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const MONTHS_FR = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

/** Format "2023-01" or "2023" for display */
export function formatPeriod(start: string, end: string | null): string {
  const format = (d: string) => {
    if (/^\d{4}-\d{2}$/.test(d)) {
      const [y, m] = d.split("-");
      return `${MONTHS_FR[parseInt(m, 10) - 1]} ${y}`;
    }
    return d;
  };
  return `${format(start)} — ${end ? format(end) : "Présent"}`;
}

export function printCv(): void {
  if (typeof window === "undefined") return;
  window.print();
}

/** Extract YouTube video id from watch / youtu.be / embed URLs */
export function youtubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    let id = u.searchParams.get("v");
    if (!id && u.hostname.includes("youtu.be")) {
      id = u.pathname.replace(/^\//, "").split(/[?/]/)[0] || null;
    }
    if (!id && u.pathname.includes("/embed/")) {
      id = u.pathname.split("/embed/")[1]?.split(/[?/]/)[0] ?? null;
    }
    if (!id && u.pathname.includes("/shorts/")) {
      id = u.pathname.split("/shorts/")[1]?.split(/[?/]/)[0] ?? null;
    }
    return id || null;
  } catch {
    return null;
  }
}

export function youtubeThumb(url: string): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

type YoutubeEmbedOptions = {
  /** Interactive player (showreel) — no autoplay */
  autoplay?: boolean;
  mute?: boolean;
  loop?: boolean;
  controls?: boolean;
  /**
   * Strip as much player chrome as possible (logo, FS, keyboard, annotations).
   * Use with controls=false for ambient feature cards.
   */
  hideChrome?: boolean;
};

/** Safe embed URL for iframe */
export function youtubeEmbedUrl(
  url: string,
  options: YoutubeEmbedOptions = {}
): string | null {
  const id = youtubeVideoId(url);
  if (!id) return null;
  const {
    autoplay = false,
    mute = false,
    loop = false,
    controls = true,
    hideChrome = false,
  } = options;
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    autoplay: autoplay ? "1" : "0",
    // Caller controls mute: project cards use mute+autoplay; language hover uses sound
    mute: mute ? "1" : "0",
    controls: controls ? "1" : "0",
  });
  // YouTube requires playlist=id for loop to work on a single video
  if (loop) {
    params.set("loop", "1");
    params.set("playlist", id);
  }
  if (hideChrome || !controls) {
    params.set("controls", "0");
    params.set("disablekb", "1");
    params.set("fs", "0");
    params.set("iv_load_policy", "3");
    params.set("cc_load_policy", "0");
    params.set("modestbranding", "1");
    // Avoid related / end-screen UI as much as possible
    params.set("rel", "0");
  }
  // nocookie reduces some branding chrome; same embed API
  const host = hideChrome
    ? "https://www.youtube-nocookie.com"
    : "https://www.youtube.com";
  return `${host}/embed/${id}?${params.toString()}`;
}

/** True if URL is a YouTube watch/share/embed link */
export function isYoutubeUrl(url: string): boolean {
  return youtubeVideoId(url) !== null;
}

/**
 * True for YouTube Shorts (vertical 9:16).
 * Detects /shorts/ path and youtu.be links that use short-style paths.
 */
export function isYoutubeShort(url: string): boolean {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (
      !host.includes("youtube.com") &&
      !host.includes("youtube-nocookie.com") &&
      !host.includes("youtu.be")
    ) {
      return false;
    }
    if (u.pathname.includes("/shorts/")) return true;
    // Some share URLs: youtube.com/short/ID (rare)
    if (/\/short\//i.test(u.pathname)) return true;
    return false;
  } catch {
    return /youtube\.com\/shorts\//i.test(url) || /\/shorts\//i.test(url);
  }
}

/**
 * Portrait when width/height < ~1 (includes 9:16 Shorts and 3:4).
 * Pass either (width, height) or (aspectRatio, 1).
 */
export function isPortraitRatio(width: number, height: number): boolean {
  if (width <= 0 || height <= 0) return false;
  return width / height < 0.95;
}

/** Extract status id from x.com / twitter.com post URLs */
export function xStatusId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (
      !host.endsWith("twitter.com") &&
      !host.endsWith("x.com") &&
      !host.endsWith("mobile.twitter.com")
    ) {
      return null;
    }
    // /user/status/123456 or /i/status/123456 or /i/web/status/123456
    const match = u.pathname.match(/\/status(?:es)?\/(\d+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function isXUrl(url: string): boolean {
  return xStatusId(url) !== null;
}

/** Canonical post URL for embeds */
export function xPostUrl(url: string): string | null {
  const id = xStatusId(url);
  if (!id) return null;
  return `https://x.com/i/status/${id}`;
}

/**
 * Official X/Twitter tweet embed iframe URL (dark theme).
 * Autoplay of embedded video is controlled by the X player (muted when possible).
 * Prefer `xVideoPlayerUrl` when you only want the video (feature cards).
 */
export function xEmbedUrl(url: string): string | null {
  const id = xStatusId(url);
  if (!id) return null;
  const params = new URLSearchParams({
    id,
    theme: "dark",
    dnt: "true",
    embedId: `x-embed-${id}`,
    frame: "false",
    hideCard: "false",
    hideThread: "true",
    lang: "fr",
  });
  return `https://platform.twitter.com/embed/Tweet.html?${params.toString()}`;
}

/**
 * Official X video-only player (no tweet text / header / actions).
 * https://twitter.com/i/videos/tweet/{id}
 */
export function xVideoPlayerUrl(url: string): string | null {
  const id = xStatusId(url);
  if (!id) return null;
  return `https://twitter.com/i/videos/tweet/${id}`;
}

/**
 * Extract X/Twitter username from @user, x.com/user, twitter.com/user, etc.
 */
export function extractXUsername(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (raw.startsWith("@")) {
    const u = raw.slice(1).replace(/[^\w]/g, "");
    return u || null;
  }
  try {
    const withProto = raw.includes("://") ? raw : `https://${raw}`;
    const u = new URL(withProto);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (
      !host.endsWith("x.com") &&
      !host.endsWith("twitter.com") &&
      !host.endsWith("mobile.twitter.com")
    ) {
      // bare username without domain
      if (/^[\w]{1,15}$/.test(raw)) return raw;
      return null;
    }
    const part = u.pathname.split("/").filter(Boolean)[0];
    if (!part || ["i", "intent", "share", "home", "explore"].includes(part)) {
      return null;
    }
    return part.replace(/[^\w]/g, "") || null;
  } catch {
    if (/^[\w]{1,15}$/.test(raw)) return raw;
    return null;
  }
}

/** Canonical profile URL for X */
export function xProfileHref(urlOrUser: string): string | null {
  const user = extractXUsername(urlOrUser);
  if (!user) {
    // try as full URL with no parseable user
    try {
      const withProto = urlOrUser.includes("://")
        ? urlOrUser
        : `https://${urlOrUser}`;
      const u = new URL(withProto);
      if (u.hostname.includes("x.com") || u.hostname.includes("twitter.com")) {
        return u.toString();
      }
    } catch {
      /* ignore */
    }
    return null;
  }
  return `https://x.com/${user}`;
}

/** True if value looks like an uploaded video (data URL, Blob, Cloudinary, path) */
export function isFileVideoUrl(url: string): boolean {
  if (url.startsWith("data:video/")) return true;
  if (url.startsWith("blob:")) return true;
  // Legacy Cloudinary video delivery
  if (
    /res\.cloudinary\.com\/[^/]+\/video\//i.test(url) ||
    /\/video\/upload\//i.test(url)
  ) {
    return true;
  }
  // Vercel Blob public URLs (extension in pathname) + common video files
  return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);
}

/** Infer media type from a media URL (migration helper) */
export function inferMediaTypeFromUrl(
  url: string | null | undefined
): "youtube" | "x" | null {
  if (!url) return null;
  if (isYoutubeUrl(url)) return "youtube";
  if (isXUrl(url)) return "x";
  return null;
}
