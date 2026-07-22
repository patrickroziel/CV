import { NextResponse } from "next/server";
import { resolveXMedia } from "@/lib/x-media";

export const runtime = "nodejs";

/**
 * GET /api/x/media?url=https://x.com/.../status/ID
 * or  /api/x/media?id=ID
 *
 * Returns a direct video URL when possible for native <video> playback.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const id = searchParams.get("id");
  const input = url || id;

  if (!input) {
    return NextResponse.json(
      { error: "Paramètre url ou id requis" },
      { status: 400 }
    );
  }

  try {
    const result = await resolveXMedia(input);
    return NextResponse.json(result, {
      headers: {
        // Cache successful media resolution (video URLs are stable enough)
        "Cache-Control": result.videoUrl
          ? "public, s-maxage=3600, stale-while-revalidate=86400"
          : "public, s-maxage=120",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Erreur résolution média X",
        videoUrl: null,
        posterUrl: null,
        source: "none",
      },
      { status: 500 }
    );
  }
}
