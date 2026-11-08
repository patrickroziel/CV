import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

const MEDIA_HOST = "https://media.patrickroziel.com";
const WIDTHS = new Set([640, 828, 1080, 1200, 1600]);

function objectKey(src: string) {
  const base = (process.env.R2_PUBLIC_URL?.trim() || MEDIA_HOST).replace(/\/$/, "");
  const root = src.startsWith(`${base}/`) ? base : src.startsWith(`${MEDIA_HOST}/`) ? MEDIA_HOST : "";
  if (!root) return "";
  const key = decodeURIComponent(src.slice(root.length + 1).split("?")[0] || "");
  if (!key.startsWith("patrick-roziel/") || key.includes("..") || key.includes("\\")) return "";
  return key;
}

async function readOriginal(src: string, key: string) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  if (accountId && accessKeyId && secretAccessKey && bucket && key) {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const bytes = await result.Body?.transformToByteArray();
    if (bytes?.byteLength) return Buffer.from(bytes);
  }
  const upstream = await fetch(src, {
    cache: "no-store",
    headers: {
      Accept: "image/jpeg,image/*,*/*;q=0.8",
      "User-Agent": "Mozilla/5.0",
      Referer: "https://patrickroziel.com/",
    },
  });
  if (!upstream.ok) return null;
  return Buffer.from(await upstream.arrayBuffer());
}

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src") || "";
  const key = objectKey(src);
  if (!key) return new NextResponse("Adresse refusée", { status: 400 });
  const asked = Number(req.nextUrl.searchParams.get("w") || "1080");
  const width = WIDTHS.has(asked) ? asked : 1080;
  try {
    const input = await readOriginal(src, key);
    if (!input) return NextResponse.redirect(src, 302);
    const output = await sharp(input, { failOn: "none" })
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
  } catch {
    return NextResponse.redirect(src, 302);
  }
}
