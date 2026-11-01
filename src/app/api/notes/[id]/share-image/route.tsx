import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getNoteSharePhoto, getNoteShareText, getPublicNote } from "@/lib/server/notes-sharing";
import { requestedShareLanguage, translateShareText } from "@/lib/server/share-locale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

/** 1200×630 card. The cover photo fills the frame when the article has one. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = await getPublicNote(id);
  if (!post) return new Response("Publication indisponible", { status: 404 });

  const photo = getNoteSharePhoto(post);
  if (photo) {
    const jpeg = await coverJpeg(photo);
    if (jpeg) {
      return new Response(new Uint8Array(jpeg), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=300, s-maxage=86400",
        },
      });
    }
  }

  const french = getNoteShareText(post);
  const lang = requestedShareLanguage(new URL(request.url).searchParams.get("lang"));
  const { title, description } = await translateShareText(french.title, french.description, lang);

  return new ImageResponse(
    <div style={{
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      height: "100%", width: "100%", padding: "65px 76px",
      backgroundColor: "#051b23",
      backgroundImage: "linear-gradient(130deg, #06141d 0%, #11313d 58%, #231723 100%)",
      color: "#f3f6f6", fontFamily: "Arial, sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", width: 12, height: 12, borderRadius: 6, backgroundColor: "#83e4e3" }} />
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: "#b9dddf", fontWeight: 600 }}>
          PATRICK ROZIEL
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, flexGrow: 1, justifyContent: "center" }}>
        <div style={{
          display: "flex", fontWeight: 700, fontSize: title.length > 65 ? 50 : 64,
          lineHeight: 1.12, overflow: "hidden", maxHeight: 234,
          letterSpacing: -1.5, overflowWrap: "break-word",
        }}>
          {title.slice(0, 110)}
        </div>
        <div style={{
          display: "flex", fontSize: 26, color: "#b6c5c9", lineHeight: 1.35,
          overflow: "hidden", maxHeight: 106,
        }}>
          {description.slice(0, 160)}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #45606a", paddingTop: 24 }}>
        <div style={{ display: "flex", fontSize: 22, color: "#ace4e3" }}>patrickroziel.com</div>
        <div style={{ display: "flex", fontSize: 18, color: "#99aab2" }}>WORK & NOTES</div>
      </div>
    </div>,
    {
      width: 1200, height: 630,
      headers: { "Cache-Control": "public, max-age=300, s-maxage=86400" },
    },
  );
}
