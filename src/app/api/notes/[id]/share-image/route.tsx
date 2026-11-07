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

async function coverJpeg(url: string) {
  const bytes = await loadPhoto(url);
  if (!bytes) return null;
  try {
    return await sharp(bytes)
      .rotate()
      .resize(1200, 630, { fit: "cover", position: "attention" })
      .jpeg({ quality: 82 })
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

function previewCard(title: string, subtitle: string, meta: string, photo: string | null) {
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
          ? "linear-gradient(to top, rgba(3,16,20,0.96) 0%, rgba(3,16,20,0.72) 36%, rgba(3,16,20,0.05) 72%)"
          : "linear-gradient(160deg, rgba(3,16,20,0.2) 0%, rgba(3,16,20,0.55) 100%)",
      }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", width: "100%", height: "100%", padding: "54px 68px" }}>
        <div style={{ display: "flex", fontSize: 22, color: "#a5f3fc" }}>{meta}</div>
        <div style={{ display: "flex", marginTop: 16, maxWidth: 1000, fontSize: title.length > 70 ? 44 : 56, fontWeight: 600, lineHeight: 1.12, letterSpacing: -1, color: "#ffffff" }}>
          {title.slice(0, 140)}
        </div>
        {subtitle ? (
          <div style={{ display: "flex", marginTop: 14, maxWidth: 980, fontSize: 26, lineHeight: 1.35, color: "#a1a1aa" }}>
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
  const lang = requestedShareLanguage(new URL(request.url).searchParams.get("lang"));
  const translated = await translateShareText(french.title, french.subtitle || " ", lang);
  const title = translated.title;
  const subtitle = french.subtitle ? translated.description.trim() : "";
  const meta = `${coercePostCategory(post)} · ${formatShareDate(post.date)}`;
  let photoSrc: string | null = null;
  const photo = getNoteSharePhoto(post);
  if (photo) {
    const jpeg = await coverJpeg(photo);
    if (jpeg) photoSrc = `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  }

  return new ImageResponse(previewCard(title, subtitle, meta, photoSrc), {
    width: 1200,
    height: 630,
    headers: { "Cache-Control": "public, max-age=300, s-maxage=86400" },
  });
}
