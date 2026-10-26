import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isPublishedPost, likeCookie, readLikes, tokenLooksValid, updateLike, visitorHash } from "@/lib/server/post-likes";

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

export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!(await isPublishedPost(id))) return NextResponse.json({ error: "Publication introuvable" }, { status: 404, headers: noCache });
  if (!process.env.DATABASE_URL) return NextResponse.json({ available: false, liked: false, count: 0 }, { headers: noCache });
  try {
    const cookie = request.cookies.get(likeCookie)?.value;
    const hash = tokenLooksValid(cookie) ? visitorHash(id, cookie!) : null;
    return NextResponse.json({ available: true, ...(await readLikes(id, hash)) }, { headers: noCache });
  } catch {
    return NextResponse.json({ available: false, liked: false, count: 0 }, { headers: noCache });
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!correctOrigin(request)) return NextResponse.json({ error: "Origine non autorisée" }, { status: 403, headers: noCache });
  if (!isPublishedPost(id)) return NextResponse.json({ error: "Publication introuvable" }, { status: 404, headers: noCache });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Base Neon non configurée" }, { status: 503, headers: noCache });
  if (Number(request.headers.get("content-length") ?? 0) > 2048)
    return NextResponse.json({ error: "Requête trop volumineuse" }, { status: 413, headers: noCache });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400, headers: noCache }); }
  if (!body || typeof body !== "object" || typeof (body as { liked?: unknown }).liked !== "boolean")
    return NextResponse.json({ error: "Action invalide" }, { status: 400, headers: noCache });
  const old = request.cookies.get(likeCookie)?.value;
  const token = tokenLooksValid(old) ? old! : randomBytes(32).toString("hex");
  try {
    const state = await updateLike(id, visitorHash(id, token), (body as { liked: boolean }).liked);
    const response = NextResponse.json({ available: true, ...state }, { headers: noCache });
    if (!tokenLooksValid(old)) {
      response.cookies.set(likeCookie, token, {
        httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
        path: "/", maxAge: 60 * 60 * 24 * 365,
      });
    }
    return response;
  } catch { return NextResponse.json({ error: "Impossible d'enregistrer le like" }, { status: 503, headers: noCache }); }
}
