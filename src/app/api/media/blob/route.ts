import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Blob files are no longer relayed. Serving them was the Fast Data Transfer bill. */
export function GET() {
  return new NextResponse("Média retiré de Vercel Blob.", {
    status: 410,
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
