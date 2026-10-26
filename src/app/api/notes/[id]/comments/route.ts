import { NextRequest, NextResponse } from "next/server";
import { isCommentablePost, listApprovedComments, submitComment } from "@/lib/server/post-comments";
import { validateOrigin } from "@/lib/server/backoffice-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!(await isCommentablePost(id))) return NextResponse.json({ error: "Publication introuvable" }, { status: 404, headers });
  if (!process.env.DATABASE_URL) return NextResponse.json({ available: false, comments: [] }, { headers });
  try {
    const comments = await listApprovedComments(id);
    return NextResponse.json({ available: true, comments }, { headers });
  } catch {
    return NextResponse.json({ available: false, comments: [] }, { headers });
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!validateOrigin(request)) return NextResponse.json({ error: "Origine non autorisée." }, { status: 403, headers });
  if (!(await isCommentablePost(id))) return NextResponse.json({ error: "Publication introuvable." }, { status: 404, headers });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Commentaires momentanément indisponibles." }, { status: 503, headers });
  if (Number(request.headers.get("content-length") ?? 0) > 6000) return NextResponse.json({ error: "Message trop volumineux." }, { status: 413, headers });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Requête invalide." }, { status: 400, headers }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Requête invalide." }, { status: 400, headers });
  const input = body as { name?: unknown; comment?: unknown; website?: unknown };
  // Quiet honeypot for basic automated spam.
  if (typeof input.website === "string" && input.website.trim()) return NextResponse.json({ submitted: true }, { headers });
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  const comment = typeof input.comment === "string" ? input.comment.trim() : "";
  if (name.length < 2 || name.length > 60) return NextResponse.json({ error: "Le nom doit contenir entre 2 et 60 caractères." }, { status: 400, headers });
  if (comment.length < 3 || comment.length > 2000) return NextResponse.json({ error: "Le commentaire doit contenir entre 3 et 2 000 caractères." }, { status: 400, headers });
  try {
    await submitComment(id, name, comment);
    return NextResponse.json({ submitted: true, message: "Merci ! Ton commentaire sera visible après validation." }, { status: 201, headers });
  } catch {
    return NextResponse.json({ error: "Impossible d'enregistrer le commentaire pour le moment." }, { status: 503, headers });
  }
}
