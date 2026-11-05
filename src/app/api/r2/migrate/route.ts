import { list } from "@vercel/blob";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { isBackofficeAdmin, validateOrigin } from "@/lib/server/backoffice-auth";
import { readPortfolio, writePortfolio } from "@/lib/server/portfolio-db";
import type { PortfolioData } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const BLOB_URL = /https:\/\/[a-z0-9.-]*blob\.vercel-storage\.com\/[^\s"'<>\\)]+/gi;

function r2() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim()?.replace(/\/$/, "");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error("Variables Cloudflare R2 incomplètes.");
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    throw new Error("BLOB_READ_WRITE_TOKEN manquant.");
  }
  return {
    bucket,
    publicUrl,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

function blobUrls(value: unknown, found = new Set<string>()): string[] {
  if (typeof value === "string") {
    for (const match of value.match(BLOB_URL) ?? []) found.add(match.replace(/[),.;]+$/, ""));
    return [...found];
  }
  if (Array.isArray(value)) {
    for (const item of value) blobUrls(item, found);
    return [...found];
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) blobUrls(item, found);
  }
  return [...found];
}

function replaceUrl(value: unknown, from: string, to: string): unknown {
  if (typeof value === "string") return value.split(from).join(to);
  if (Array.isArray(value)) return value.map((item) => replaceUrl(item, from, to));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceUrl(item, from, to)]));
  }
  return value;
}

async function copyOne(url: string) {
  const store = r2();
  const token = process.env.BLOB_READ_WRITE_TOKEN!.trim();
  const source = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!source.ok) throw new Error(`Blob ${source.status}`);
  const length = Number(source.headers.get("content-length") || 0);
  if (length > 45 * 1024 * 1024) throw new Error("Fichier trop lourd pour un passage (plus de 45 Mo).");
  const pathname = decodeURIComponent(new URL(url).pathname.replace(/^\/+/, ""));
  if (!pathname || pathname.includes("..")) throw new Error("Chemin refusé.");
  const body = Buffer.from(await source.arrayBuffer());
  await store.client.send(new PutObjectCommand({
    Bucket: store.bucket,
    Key: pathname,
    Body: body,
    ContentType: source.headers.get("content-type") || "application/octet-stream",
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return `${store.publicUrl}/${pathname}`;
}

async function saveReplacement(from: string, to: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const snapshot = await readPortfolio();
    if (!snapshot.data) throw new Error("Contenu introuvable.");
    const next = replaceUrl(snapshot.data, from, to) as PortfolioData;
    const revision = await writePortfolio(next, snapshot.revision);
    if (revision !== null) return;
  }
  throw new Error("Le contenu a changé pendant la copie. Relance.");
}

export async function POST(request: Request) {
  if (!(await isBackofficeAdmin()) || !validateOrigin(request)) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  let body: { phase?: string; cursor?: string; skip?: string[] } = {};
  try { body = await request.json(); } catch { body = {}; }
  const skip = new Set(body.skip ?? []);

  try {
    if (body.phase === "store") {
      const page = await list({ cursor: body.cursor, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
      const blob = page.blobs[0];
      if (!blob) return NextResponse.json({ done: true, remaining: 0 });
      if (skip.has(blob.url)) {
        return NextResponse.json({ skipped: blob.url, cursor: page.cursor, done: !page.hasMore });
      }
      const nextUrl = await copyOne(blob.url);
      await saveReplacement(blob.url, nextUrl);
      return NextResponse.json({
        copied: blob.pathname,
        cursor: page.cursor,
        done: !page.hasMore,
      });
    }

    const snapshot = await readPortfolio();
    const pending = blobUrls(snapshot.data).filter((url) => !skip.has(url));
    const url = pending[0];
    if (!url) return NextResponse.json({ done: true, remaining: 0 });
    try {
      const nextUrl = await copyOne(url);
      await saveReplacement(url, nextUrl);
      return NextResponse.json({ copied: url, remaining: pending.length - 1, done: pending.length === 1 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Copie impossible.";
      return NextResponse.json({ failed: url, error: message, remaining: pending.length });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Copie impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
