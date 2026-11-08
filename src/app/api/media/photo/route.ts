import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

const MEDIA_HOST = "https://media.patrickroziel.com/";
const WIDTHS = new Set([640, 828, 1080, 1200, 1600]);

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src") || "";
  if (!src.startsWith(MEDIA_HOST) || src.includes("..") || src.includes("\\")) {
    return new NextResponse("Adresse refusée", { status: 400 });
  }
  const asked = Number(req.nextUrl.searchParams.get("w") || "1080");
  const width = WIDTHS.has(asked) ? asked : 1080;
  let upstream: Response;
  try {
    upstream = await fetch(src, {
      cache: "no-store",
      redirect: "follow",
      headers: {
        Accept: "image/jpeg,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; PatrickRoziel/1.0)",
        Referer: "https://patrickroziel.com/",
      },
    });
  } catch (error) {
    const failed = NextResponse.redirect(src, 302);
    failed.headers.set("X-Upstream-Status", error instanceof Error ? error.message : "fetch");
    return failed;
  }
  if (!upstream.ok) {
    const failed = NextResponse.redirect(src, 302);
    failed.headers.set("X-Upstream-Status", String(upstream.status));
    failed.headers.set("X-Upstream-Type", upstream.headers.get("content-type") || "");
    return failed;
  }
  const input = Buffer.from(await upstream.arrayBuffer());
  try {
    const output = await sharp(input, { failOn: "none", unlimited: true })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: 75, mozjpeg: true })
      .toBuffer();
    return new NextResponse(new Uint8Array(output), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const failed = NextResponse.redirect(src, 302);
    failed.headers.set("X-Upstream-Status", error instanceof Error ? error.name : "sharp");
    return failed;
  }
}
