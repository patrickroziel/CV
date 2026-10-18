import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isPublishedPost, likeState, setLike, likeCookie, tokenLooksValid, visitorHash } from "@/lib/server/post-likes";
import { validateOrigin } from "@/lib/server/backoffice-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noCache = { "Cache-Control": "private, no-store" };
type Context = { params: Promise<{ id: string }> };

async function validPost(id: string) {
  try { return await isPublishedPost(id); } catch { return false; }
}
export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!(await validPost(id))) return NextResponse.json({ error: "Publication introuvable" }, { status: 404, headers: noCache });
  if (!process.env.DATABASE_URL || !process.env.BACKOFFICE_SESSION_SECRET)
    return NextResponse.json({ available: false, count: 0, liked: false }, { headers: noCache });
  try {
    const cookie = request.cookies.get(likeCookie)?.value;
    const hash = tokenLooksValid(cookie) ? visitorHash(cookie!) : null;
    return NextResponse.json({ available: true, ...(await likeState(id, hash)) }, { headers: noCache });
  } catch {
    return NextResponse.json({ available: false, count: 0, liked: false }, { headers: noCache });
  }
}
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!validateOrigin(request)) return NextResponse.json({ error: "Origine non autorisée" }, { status: 403, headers: noCache });
  if (!(await validPost(id))) return NextResponse.json({ error: "Publication introuvable" }, { status: 404, headers: noCache });
  if (!process.env.DATABASE_URL || !process.env.BACKOFFICE_SESSION_SECRET)
    return NextResponse.json({ error: "Likes indisponibles" }, { status: 503, headers: noCache });
  let body: { liked?: boolean };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Requête invalide" }, { status: 400, headers: noCache }); }
  if (typeof body.liked !== "boolean") return NextResponse.json({ error: "Action invalide" }, { status: 400, headers: noCache });
  const old = request.cookies.get(likeCookie)?.value;
  const token = tokenLooksValid(old) ? old! : randomBytes(32).toString("hex");
  const hash = visitorHash(token);
  if (!hash) return NextResponse.json({ error: "Configuration manquante" }, { status: 503, headers: noCache });
  try {
    const state = await setLike(id, hash, body.liked);
    const response = NextResponse.json({ available: true, ...state }, { headers: noCache });
    if (!tokenLooksValid(old)) response.cookies.set(likeCookie, token, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      path: "/", maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch { return NextResponse.json({ error: "Impossible d'enregistrer le like" }, { status: 503, headers: noCache }); }
}
