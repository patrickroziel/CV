const MEDIA_HOST = "https://media.patrickroziel.com/";

function fittedWidth(width: number) {
  if (width >= 1400) return 1600;
  if (width >= 1000) return 1200;
  if (width >= 900) return 1080;
  if (width >= 700) return 828;
  return 640;
}

/** Small JPEG from our own server. Full Cloudflare files break iPhone Safari. */
export function displayImageUrl(src: string, width = 1080): string {
  if (!src.startsWith(MEDIA_HOST)) return src;
  return `/api/media/photo?src=${encodeURIComponent(src)}&w=${fittedWidth(width)}`;
}

export function shrinkHostedImages(html: string): string {
  return html.replace(/https:\/\/media\.patrickroziel\.com\/[^"'\\\s>]+/g, (url) => displayImageUrl(url, 1080));
}
