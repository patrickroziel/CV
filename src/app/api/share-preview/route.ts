import { getNoteSharePhoto, getNoteShareText, getPublicNote, NOTES_ORIGIN } from "@/lib/server/notes-sharing";
import { openGraphLocale, requestedShareLanguage, shareImageUrl, translateShareText } from "@/lib/server/share-locale";

export const runtime = "nodejs";
export const revalidate = 21600;

function escapeAttr(value: string) {
  return value.replace(/[&"<>]/g, (char) => {
    if (char === "&") return "&" + "amp;";
    if (char === "\"") return "&" + "quot;";
    if (char === "<") return "&" + "lt;";
    return "&" + "gt;";
  });
}

/** The card X reads. It follows the language written in the destination link. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") || "";
  const kind = url.searchParams.get("kind") === "air" ? "air" : "notes";
  const lang = requestedShareLanguage(url.searchParams.get("lang"));
  const post = await getPublicNote(id);
  if (!post || (kind === "air" ? post.universe !== "air" : post.universe === "air")) {
    return new Response("Publication indisponible", { status: 404 });
  }

  const french = getNoteShareText(post);
  const translated = await translateShareText(french.title, french.subtitle || french.description, lang);
  const title = french.subtitle && kind !== "air"
    ? `${translated.title} — ${translated.description.trim() || french.subtitle}`
    : translated.title;
  const description = (french.subtitle ? french.description : translated.description).replace(/\s+/g, " ").trim();
  const translatedDescription = french.subtitle
    ? (await translateShareText(description, " ", lang)).title
    : translated.description;
  const page = `${NOTES_ORIGIN}/${kind}/${encodeURIComponent(id)}?lang=${encodeURIComponent(lang || "")}`;
  const image = shareImageUrl(id, lang, getNoteSharePhoto(post));
  const locale = openGraphLocale(lang);
  const site = kind === "air" ? "Patrick Roziel — Scope" : "Patrick Roziel — Notes";
  const html = `<!doctype html>
<html lang="${escapeAttr(lang || "fr")}">
<head>
<meta charset="utf-8">
<title>${escapeAttr(title)}</title>
<meta name="description" content="${escapeAttr(translatedDescription)}">
<meta property="og:type" content="article">
<meta property="og:locale" content="${escapeAttr(locale)}">
<meta property="og:site_name" content="${escapeAttr(site)}">
<meta property="og:url" content="${escapeAttr(page)}">
<meta property="og:title" content="${escapeAttr(title)}">
<meta property="og:description" content="${escapeAttr(translatedDescription)}">
<meta property="og:image" content="${escapeAttr(image)}">
<meta property="og:image:secure_url" content="${escapeAttr(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeAttr(title)}">
<meta name="twitter:description" content="${escapeAttr(translatedDescription)}">
<meta name="twitter:image" content="${escapeAttr(image)}">
</head>
<body></body>
</html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=604800",
      "CDN-Cache-Control": "public, s-maxage=21600, stale-while-revalidate=604800",
    },
  });
}
