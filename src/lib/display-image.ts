const WIDTHS = [256, 384, 640, 828, 1080, 1200, 1920] as const;
export type ImageWidth = (typeof WIDTHS)[number];

function hosted(hostname: string) {
  return hostname === "media.patrickroziel.com"
    || hostname === "images.unsplash.com"
    || hostname === "res.cloudinary.com"
    || hostname.endsWith(".public.blob.vercel-storage.com");
}

/** Same-origin resized URL. Avoids shipping multi-megabyte originals to the browser. */
export function displayImageUrl(src: string, width: ImageWidth = 1080): string {
  if (!src || src.startsWith("/") || src.startsWith("data:") || src.startsWith("blob:")) return src;
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }
  if (url.protocol !== "https:" || !hosted(url.hostname)) return src;
  return `/_next/image?url=${encodeURIComponent(url.toString())}&w=${width}&q=75`;
}

/** Rewrite hosted <img src> inside saved article HTML. Leaves links untouched. */
export function shrinkHostedImages(html: string): string {
  return html.replace(
    /(<img\b[^>]*?\ssrc\s*=\s*)(["'])(https:\/\/[^"']+)\2/gi,
    (match, prefix: string, quote: string, url: string) => {
      const next = displayImageUrl(url, 1080);
      return next === url ? match : `${prefix}${quote}${next}${quote}`;
    },
  );
}
