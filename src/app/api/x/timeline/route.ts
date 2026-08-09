import { NextResponse } from "next/server";
import { fetchXTimeline } from "@/lib/x-timeline";

export const runtime = "nodejs";

/**
 * GET /api/x/timeline?user=patrickroziel
 * or  /api/x/timeline?user=@user / https://x.com/user
 *
 * Returns profile + recent tweets for the sidebar feed.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get("user") || searchParams.get("username");

  if (!user?.trim()) {
    return NextResponse.json(
      { error: "Paramètre user requis", user: null, tweets: [] },
      { status: 400 }
    );
  }

  try {
    const result = await fetchXTimeline(user);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control":
          result.tweets.length > 0
            ? "public, s-maxage=120, stale-while-revalidate=600"
            : "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erreur chargement timeline X",
        user: null,
        tweets: [],
        source: "none",
      },
      { status: 500 }
    );
  }
}
