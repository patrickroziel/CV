import { NextResponse } from "next/server";
import type { PortfolioData } from "@/lib/types";
import { isBackofficeAdmin, validateOrigin } from "@/lib/server/backoffice-auth";
import { loadPortfolio, savePortfolio } from "@/lib/server/portfolio-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  if (!(await isBackofficeAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 401, headers });
  try {
    const result = await loadPortfolio();
    return NextResponse.json({
      data: result.data,
      revision: result.revision,
      writeSeq: result.writeSeq,
      initialized: result.storage !== "snapshot",
      storage: result.storage,
    }, { headers });
  } catch {
    return NextResponse.json({ error: "Contenu indisponible." }, { status: 503, headers });
  }
}

export async function PUT(request: Request) {
  if (!(await isBackofficeAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 401, headers });
  if (!validateOrigin(request)) return NextResponse.json({ error: "Origine interdite." }, { status: 403, headers });
  if (Number(request.headers.get("content-length") ?? 0) > 3_000_000)
    return NextResponse.json({ error: "Contenu trop volumineux." }, { status: 413, headers });
  let body: string;
  try { body = await request.text(); } catch { return NextResponse.json({ error: "Corps illisible." }, { status: 400, headers }); }
  if (body.length > 3_000_000) return NextResponse.json({ error: "Contenu trop volumineux." }, { status: 413, headers });
  let data: PortfolioData, revision: number, incomingSeq = 0;
  try {
    const parsed = JSON.parse(body) as { data?: PortfolioData; expectedRevision?: number; writeSeq?: number };
    if (!parsed.data || typeof parsed.data !== "object" ||
        !parsed.data.profile || !Array.isArray(parsed.data.experiences) ||
        !Array.isArray(parsed.data.projects) || !Array.isArray(parsed.data.skills) ||
        !Array.isArray(parsed.data.education) || !Array.isArray(parsed.data.languages) ||
        !Array.isArray(parsed.data.socialPosts) ||
        typeof parsed.expectedRevision !== "number" || !Number.isSafeInteger(parsed.expectedRevision) ||
        parsed.expectedRevision < 0) throw new Error("JSON invalide");
    data = parsed.data;
    revision = parsed.expectedRevision;
    const seq = parsed.writeSeq;
    incomingSeq = typeof seq === "number" && Number.isSafeInteger(seq) && seq > 0 ? seq : 0;
  } catch { return NextResponse.json({ error: "Données ou révision invalides." }, { status: 400, headers }); }
  try {
    const saved = await savePortfolio(data, revision, incomingSeq);
    return NextResponse.json({ revision: saved.revision, writeSeq: saved.writeSeq, stale: saved.stale }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sauvegarde impossible.";
    console.error("portfolio save error", message);
    return NextResponse.json({ error: message }, { status: 503, headers });
  }
}
