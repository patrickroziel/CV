/** Keep the original Cloudflare file. iPhone Safari refuses the Next.js image proxy. */
export function displayImageUrl(src: string): string {
  return src;
}

/** Article HTML already stores the real media address. Do not rewrite it. */
export function shrinkHostedImages(html: string): string {
  return html;
}
