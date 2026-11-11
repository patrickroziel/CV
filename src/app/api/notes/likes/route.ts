import { NextRequest, NextResponse } from "next/server";
import { cleanPostIds, likeCookie, publishedIdSet, readLikeStates, tokenLooksValid, visitorHash } from "@/lib/server/post-likes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noCache = { "Cache-Control": "private, no-store" };

/** Counts for every visible heart, in a batched private-storage reads. */
export async function GET(request: NextRequest) {
  const ids = cleanPostIds((request.nextUrl.searchParams.get("ids") ?? "").split(","));
  if (!ids.length) return NextResponse.json({ posts: {} }, { headers: noCache });
  if (!process.env.PRIVATE_BLOB_READ_WRITE_TOKEN) {
    const posts = Object.fromEntries(ids.map((id) => [id, { available: false, count: 0, liked: false }]));
    return NextResponse.json({ posts }, { headers: noCache });
  }
  try {
    const known = await publishedIdSet();
    const live = known ? ids.filter((id) => known.has(id)) : [];
    const token = request.cookies.get(likeCookie)?.value;
    const hashes = tokenLooksValid(token)
      ? Object.fromEntries(live.map((id) => [id, visitorHash(id, token!)]))
      : {};
    const states = await readLikeStates(live, hashes);
    const posts = Object.fromEntries(ids.map((id) => {
      const state = states[id];
      return [id, state
        ? { available: true, count: state.count, liked: state.liked }
        : { available: false, count: 0, liked: false }];
    }));
    return NextResponse.json({ posts }, { headers: noCache });
  } catch {
    const posts = Object.fromEntries(ids.map((id) => [id, { available: false, count: 0, liked: false }]));
    return NextResponse.json({ posts }, { headers: noCache });
  }
}
