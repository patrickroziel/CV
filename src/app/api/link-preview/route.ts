import { lookup } from "node:dns/promises";
import { NextRequest, NextResponse } from "next/server";
import { hostLabel, safeHref, safeImageSrc } from "@/lib/safe-href";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPublicAddress(ip: string): boolean {
  const value = ip.toLowerCase();
  if (value.includes(":")) {
    return value !== "::" && value !== "::1" && !value.startsWith("fe80:") && !value.startsWith("fc") && !value.startsWith("fd");
  }
  const parts = value.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  return true;
}

async function isPublicHost(hostname: string): Promise<boolean> {
  const host = hostname.toLowerCase().replace(/\.+$/, "");
  if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  try {
    const records = await lookup(host, { all: true, verbatim: true });
    return records.length > 0 && records.every((record) => isPublicAddress(record.address));
  } catch {
    return false;
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&/gi, "&")
    .replace(/"/gi, "\"")
    .replace(/&#39;|'/gi, "'")
    .replace(/</gi, "<")
    .replace(/>/gi, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html: string, key: string): string {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const needle = key.toLowerCase();
  for (const tag of tags) {
    const attr = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (attr !== needle) continue;
    const content = tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1];
    if (content) return decodeEntities(content);
  }
  return "";
}

async function readLimited(response: Response, max: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (received < max) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    received += value.byteLength;
    chunks.push(value);
  }
  await reader.cancel().catch(() => undefined);
  const text = new TextDecoder().decode(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))));
  return text.slice(0, max);
}

async function fetchHtml(start: URL): Promise<{ url: URL; html: string } | null> {
  let current = start;
  for (let hop = 0; hop < 4; hop += 1) {
    if (!(await isPublicHost(current.hostname))) return null;
    const response = await fetch(current, {
      redirect: "manual",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Mozilla/5.0 (compatible; PatrickRozielPreview/1.0)",
      },
      signal: AbortSignal.timeout(7000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return null;
      const next = new URL(location, current);
      if (next.protocol !== "http:" && next.protocol !== "https:") return null;
      current = next;
      continue;
    }
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "";
    if (type && !/text\/html|application\/xhtml/i.test(type)) return null;
    return { url: current, html: await readLimited(response, 280_000) };
  }
  return null;
}

export async function GET(request: NextRequest) {
  const href = safeHref(request.nextUrl.searchParams.get("url") ?? "");
  if (!href || !/^https?:\/\//i.test(href)) {
    return NextResponse.json({ error: "Adresse invalide" }, { status: 400 });
  }
  try {
    const page = await fetchHtml(new URL(href));
    if (!page) return NextResponse.json({ error: "Page inaccessible" }, { status: 422 });
    const title = metaContent(page.html, "og:title")
      || decodeEntities(page.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "")
      || hostLabel(page.url.toString());
    const description = metaContent(page.html, "og:description") || metaContent(page.html, "description");
    const imageRaw = metaContent(page.html, "og:image") || metaContent(page.html, "twitter:image");
    const image = imageRaw ? safeImageSrc(new URL(imageRaw, page.url).toString()) : null;
    return NextResponse.json({
      url: page.url.toString(),
      host: hostLabel(page.url.toString()),
      title: title.slice(0, 180),
      description: description.slice(0, 240),
      image: image ?? "",
    }, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch {
    return NextResponse.json({ error: "Aperçu indisponible" }, { status: 422 });
  }
}
