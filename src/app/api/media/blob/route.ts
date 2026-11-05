import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function allowedBlobUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    const host = url.hostname;
    const ok = url.protocol === "https:" && (host === "blob.vercel-storage.com" || host.endsWith(".blob.vercel-storage.com"));
    return ok ? url : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const target = allowedBlobUrl(request.nextUrl.searchParams.get("url")?.trim() ?? "");
  if (!target) return new NextResponse("Adresse refusée", { status: 400 });

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const upstream = await fetch(target, { headers, redirect: "manual" });
  if (upstream.status >= 300 && upstream.status < 400) {
    return new NextResponse("Redirection refusée", { status: 502 });
  }
  const type = upstream.headers.get("content-type") || "";
  if (!upstream.ok || !upstream.body || (!type.startsWith("image/") && !type.startsWith("video/"))) {
    return new NextResponse("Image indisponible", { status: upstream.status || 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
