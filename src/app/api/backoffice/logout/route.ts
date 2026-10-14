import { NextResponse } from "next/server";
import { clearSessionCookie, validateOrigin } from "@/lib/server/backoffice-auth";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!validateOrigin(request)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  clearSessionCookie(response);
  return response;
}
