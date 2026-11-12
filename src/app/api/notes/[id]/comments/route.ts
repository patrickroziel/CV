import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isPublishedPost, likeCookie, publicComments, addComment, tokenLooksValid, visitorHash } from "@/lib/server/post-likes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noCache = { "Cache-Control": "private, no-store" };
type Context = { params: Promise<{ id: string }> };

function correctOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === request.nextUrl.origin; }
  catch { return false; }
}

function visitorKey(request: NextRequest) {
  const cookie = request.cookies.get(likeCookie)?.value;
  if (tokenLooksValid(cookie)) return visitorHash("comments", cookie!);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0";
  return createHash("sha256").update(`comment-ip:${ip}`).digest("hex");
}

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!(await isPublishedPost(id))) return NextResponse.json({ comments: [] }, { headers: noCache });
  try {
    return NextResponse.json({ comments: await publicComments(id) }, { headers: noCache });
  } catch {
    return NextResponse.json({ comments: [] }, { headers: noCache });
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!correctOrigin(request)) return NextResponse.json({ error: "Origine non autorisée." }, { status: 403, headers: noCache });
  if (!(await isPublishedPost(id))) return NextResponse.json({ error: "Publication introuvable." }, { status: 404, headers: noCache });
  if (Number(request.headers.get("content-length") ?? 0) > 8_000)
    return NextResponse.json({ error: "Message trop long." }, { status: 413, headers: noCache });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Message illisible." }, { status: 400, headers: noCache }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Message illisible." }, { status: 400, headers: noCache });
  const payload = body as { name?: unknown; body?: unknown; website?: unknown };
  if (typeof payload.website === "string" && payload.website.trim()) {
    return NextResponse.json({ ok: true }, { headers: noCache });
  }
  if (typeof payload.name !== "string" || typeof payload.body !== "string") {
    return NextResponse.json({ error: "Indique un prénom et un message." }, { status: 400, headers: noCache });
  }
  const old = request.cookies.get(likeCookie)?.value;
  const token = tokenLooksValid(old) ? old! : randomBytes(32).toString("hex");
  try {
    await addComment(id, payload.name, payload.body, tokenLooksValid(old) ? visitorKey(request) : visitorHash("comments", token));
    const response = NextResponse.json({ ok: true }, { headers: noCache });
    if (!tokenLooksValid(old)) {
      response.cookies.set(likeCookie, token, {
        httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
        path: "/", maxAge: 60 * 60 * 24 * 365,
      });
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Envoi impossible.";
    return NextResponse.json({ error: message }, { status: 400, headers: noCache });
  }
}
