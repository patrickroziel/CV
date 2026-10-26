import { NextResponse } from "next/server";
import { isBackofficeAdmin, validateOrigin } from "@/lib/server/backoffice-auth";
import { listModerationComments, moderateComment } from "@/lib/server/post-comments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  if (!(await isBackofficeAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 401, headers });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Base de données non configurée." }, { status: 503, headers });
  try {
    return NextResponse.json({ comments: await listModerationComments() }, { headers });
  } catch {
    return NextResponse.json({ error: "Impossible de charger les commentaires." }, { status: 503, headers });
  }
}

export async function PATCH(request: Request) {
  if (!(await isBackofficeAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 401, headers });
  if (!validateOrigin(request)) return NextResponse.json({ error: "Origine interdite." }, { status: 403, headers });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Requête invalide." }, { status: 400, headers }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Requête invalide." }, { status: 400, headers });
  const input = body as { id?: unknown; action?: unknown };
  if (typeof input.id !== "string" || input.id.length > 80 ||
      !["approve", "reject", "delete"].includes(String(input.action))) {
    return NextResponse.json({ error: "Action invalide." }, { status: 400, headers });
  }
  try {
    await moderateComment(input.id, input.action as "approve" | "reject" | "delete");
    return NextResponse.json({ success: true }, { headers });
  } catch {
    return NextResponse.json({ error: "La modération a échoué." }, { status: 503, headers });
  }
}
