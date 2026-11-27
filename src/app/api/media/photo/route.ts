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

const encodedCache = new Map<string, Buffer>();
const encodedOrder: string[] = [];
const ENCODED_MAX = 24;

function rememberEncoded(key: string, bytes: Buffer) {
  if (encodedCache.has(key)) return;
  encodedCache.set(key, bytes);
  encodedOrder.push(key);
  while (encodedOrder.length > ENCODED_MAX) {
    const oldest = encodedOrder.shift();
    if (oldest) encodedCache.delete(oldest);
  }
}

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src") || "";
  const key = objectKey(src);
  if (!key) return new NextResponse("Adresse refusée", { status: 400 });
  const asked = Number(req.nextUrl.searchParams.get("w") || "1080");
  const width = WIDTHS.has(asked) ? asked : 1080;
  const cacheKey = `${key}:${width}`;
  const cached = encodedCache.get(cacheKey);
  if (cached) return imageResponse(cached);
  try {
    const input = await readOriginal(src, key);
    if (!input) return NextResponse.redirect(src, 302);
    const output = await sharp(input, { failOn: "none" })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: 75, mozjpeg: true })
      .toBuffer();
    const bytes = Buffer.from(output);
    rememberEncoded(cacheKey, bytes);
    return imageResponse(bytes);
  } catch {
    return NextResponse.redirect(src, 302);
  }
}

function imageResponse(bytes: Buffer) {
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": "inline",
      // max-age is the browser. s-maxage and CDN-Cache-Control are the Vercel CDN.
      // Without them, every visit re-runs sharp and burns Fluid Active CPU.
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "CDN-Cache-Control": "public, s-maxage=31536000, stale-while-revalidate=31536000",
    },
  });
}
