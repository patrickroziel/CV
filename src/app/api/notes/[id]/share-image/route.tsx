import sharp from "sharp";
import { getNoteSharePhoto, getNoteShareText, getPublicNote } from "@/lib/server/notes-sharing";
import { requestedShareLanguage, translateShareText } from "@/lib/server/share-locale";
import { getL } from "@/lib/i18n-content";
import { stripHtml } from "@/lib/sanitize-html";
import { renderShareImage } from "@/lib/og/share-card";

export const runtime = "nodejs";
export const revalidate = 21600;

async function loadPhoto(url: string) {
  const candidates = [url];
  if (url.includes("/maxresdefault.jpg")) {
    candidates.push(url.replace("/maxresdefault.jpg", "/hqdefault.jpg"));
  }
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "patrickroziel-share-preview" },
      });
      if (!response.ok) continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.byteLength < 8000) continue;
      return bytes;
    } catch {
      continue;
    }
  }
  return null;
}

async function coverJpeg(url: string, width: number, height: number) {
  const bytes = await loadPhoto(url);
  if (!bytes) return null;
  try {
    return await sharp(bytes)
      .rotate()
      .resize(width, height, { fit: "cover", position: "attention" })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch {
    return null;
  }
}

/** 1200×630, or 1080×1920 for a story. Cover stays in the background. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = await getPublicNote(id);
  if (!post) return new Response("Publication indisponible", { status: 404 });

  const french = getNoteShareText(post);
  const requestUrl = new URL(request.url);
  const story = requestUrl.searchParams.get("format") === "story";
  const width = story ? 1080 : 1200;
  const height = story ? 1920 : 630;
  const lang = requestedShareLanguage(requestUrl.searchParams.get("lang"));
  const translated = await translateShareText(french.title, french.subtitle || " ", lang);
  const title = translated.title;
  const subtitle = french.subtitle ? translated.description.trim() : "";
  const episode = post.universe === "air" && post.episode?.trim()
    ? `${lang ? (await translateShareText("Épisode", " ", lang)).title : "Épisode"} ${post.episode.trim().replace(/^épisode\s+/i, "")}`
    : "";
  const leadRaw = post.universe === "air"
    ? stripHtml(getL(post.articleSubtitle, "fr")).replace(/\s+/g, " ").trim().slice(0, 180)
    : "";
  const lead = leadRaw ? (await translateShareText(leadRaw, " ", lang)).title : "";
  const second = [subtitle, episode, lead].filter(Boolean).filter((line, index, all) => all.indexOf(line) === index).join(" — ");
  let photoSrc: string | null = null;
  const photo = getNoteSharePhoto(post);
  if (photo) {
    const jpeg = await coverJpeg(photo, width, height);
    if (jpeg) photoSrc = `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  }

  const rendered = await renderShareImage({ title, subtitle: second, width, height, photo: photoSrc });
  const png = Buffer.from(await rendered.arrayBuffer());
  const jpeg = await sharp(png).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  return new Response(jpeg, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=604800",
      "CDN-Cache-Control": "public, s-maxage=21600, stale-while-revalidate=604800",
    },
  });
}
