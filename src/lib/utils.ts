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
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

/** True if URL is a YouTube watch/share/embed link */
export function isYoutubeUrl(url: string): boolean {
  return youtubeVideoId(url) !== null;
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

/** True if value looks like a local/uploaded video (data URL or common video path) */
export function isFileVideoUrl(url: string): boolean {
  if (url.startsWith("data:video/")) return true;
  if (url.startsWith("blob:")) return true;
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
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
