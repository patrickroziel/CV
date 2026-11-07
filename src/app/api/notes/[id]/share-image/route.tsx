import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getNoteSharePhoto, getNoteShareText, getPublicNote } from "@/lib/server/notes-sharing";
import { requestedShareLanguage, translateShareText } from "@/lib/server/share-locale";
import { coercePostCategory } from "@/lib/post-taxonomy";

export const runtime = "nodejs";
export const revalidate = 60;

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
      // YouTube's missing maxres thumb is a tiny placeholder. Skip it.
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

function formatShareDate(iso: string) {
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function previewCard(title: string, subtitle: string, meta: string, photo: string | null, story: boolean) {
  return (
    <div style={{
      display: "flex", position: "relative", height: "100%", width: "100%",
      backgroundColor: "#031014", color: "#ffffff", fontFamily: "Arial, sans-serif", overflow: "hidden",
      backgroundImage: photo ? `url(${photo})` : "linear-gradient(160deg, #031014 0%, #0c2a33 100%)",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      <div style={{
        display: "flex", position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        backgroundImage: photo
          ? "linear-gradient(to top, rgba(3,16,20,0.96) 0%, rgba(3,16,20,0.78) 34%, rgba(3,16,20,0.08) 62%)"
          : "linear-gradient(160deg, rgba(3,16,20,0.2) 0%, rgba(3,16,20,0.55) 100%)",
      }} />
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative",
        width: "100%", height: "100%", padding: story ? "240px 72px 300px" : "54px 68px",
      }}>
        <div style={{ display: "flex", fontSize: story ? 28 : 22, color: "#a5f3fc" }}>{meta}</div>
        <div style={{
          display: "flex", marginTop: story ? 22 : 16, maxWidth: story ? 920 : 1000,
          fontSize: story ? (title.length > 60 ? 62 : 76) : (title.length > 70 ? 44 : 56),
          fontWeight: 600, lineHeight: 1.12, letterSpacing: -1, color: "#ffffff",
        }}>
          {title.slice(0, 140)}
        </div>
        {subtitle ? (
          <div style={{
            display: "flex", marginTop: story ? 20 : 14, maxWidth: story ? 900 : 980,
            fontSize: story ? 34 : 26, lineHeight: 1.35, color: "#a1a1aa",
          }}>
            {subtitle.slice(0, 180)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** 1200×630 card: cover, then the Notes title and subtitle. */
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
  const meta = `${coercePostCategory(post)} · ${formatShareDate(post.date)}`;
  let photoSrc: string | null = null;
  const photo = getNoteSharePhoto(post);
  if (photo) {
    const jpeg = await coverJpeg(photo, width, height);
    if (jpeg) photoSrc = `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  }

  return new ImageResponse(previewCard(title, subtitle, meta, photoSrc, story), {
    width,
    height,
    headers: { "Cache-Control": "public, max-age=300, s-maxage=86400" },
  });
}
