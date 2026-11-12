import { NextResponse } from "next/server";
import { isBackofficeAdmin, validateOrigin } from "@/lib/server/backoffice-auth";
import { listModerationComments, moderateComment } from "@/lib/server/post-likes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  if (!(await isBackofficeAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 401, headers });
  try {
    const comments = await listModerationComments();
    return NextResponse.json({
      pending: comments.filter((comment) => comment.status === "pending"),
      approved: comments.filter((comment) => comment.status === "approved").slice(0, 30),
    }, { headers });
  } catch {
    return NextResponse.json({ error: "Commentaires indisponibles." }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  if (!(await isBackofficeAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 401, headers });
  if (!validateOrigin(request)) return NextResponse.json({ error: "Origine interdite." }, { status: 403, headers });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Requête illisible." }, { status: 400, headers }); }
  const payload = body as { id?: unknown; action?: unknown };
  if (typeof payload.id !== "string" || (payload.action !== "approve" && payload.action !== "reject" && payload.action !== "delete")) {
    return NextResponse.json({ error: "Action invalide." }, { status: 400, headers });
  }
  try {
    await moderateComment(payload.id, payload.action);
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action impossible.";
    return NextResponse.json({ error: message }, { status: 400, headers });
  }
}
