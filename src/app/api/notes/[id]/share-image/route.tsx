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

function previewCard(title: string, subtitle: string, category: string, photo: string | null, story: boolean) {
  const titleSize = story ? (title.length > 48 ? 58 : 72) : (title.length > 48 ? 42 : 54);
  const subtitleSize = story ? 36 : 28;
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
          ? "linear-gradient(rgba(3,16,20,0.42), rgba(3,16,20,0.42))"
          : "linear-gradient(160deg, rgba(3,16,20,0.15) 0%, rgba(3,16,20,0.45) 100%)",
      }} />
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        position: "relative", width: "100%", height: "100%",
        padding: story ? "0 80px" : "0 72px", textAlign: "center",
      }}>
        {category ? (
          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <div style={{ display: "flex", fontSize: story ? 26 : 18, letterSpacing: 3, color: "#a5f3fc", textAlign: "center" }}>
              {category}
            </div>
          </div>
        ) : null}
        <div style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: category ? (story ? 28 : 18) : 0 }}>
          <div style={{
            display: "flex", maxWidth: story ? 880 : 980, fontSize: titleSize, fontWeight: 600,
            lineHeight: 1.12, letterSpacing: -1, color: "#ffffff", textAlign: "center",
          }}>
            {title.slice(0, 140)}
          </div>
        </div>
        {subtitle ? (
          <div style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: story ? 24 : 16 }}>
            <div style={{
              display: "flex", maxWidth: story ? 860 : 920, fontSize: subtitleSize, fontWeight: 700,
              lineHeight: 1.3, color: "#ffffff", textAlign: "center",
            }}>
              {subtitle.slice(0, 180)}
            </div>
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
  const category = (await translateShareText(coercePostCategory(post), " ", lang)).title;
  let photoSrc: string | null = null;
  const photo = getNoteSharePhoto(post);
  if (photo) {
    const jpeg = await coverJpeg(photo, width, height);
    if (jpeg) photoSrc = `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  }

  const rendered = new ImageResponse(previewCard(title, subtitle, category, photoSrc, story), {
    width,
    height,
  });
  const png = Buffer.from(await rendered.arrayBuffer());
  const jpeg = await sharp(png).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  return new Response(jpeg, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=300, s-maxage=86400",
    },
  });
}
