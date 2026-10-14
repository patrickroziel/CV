import { NextResponse } from "next/server";
import { authConfigured, isBackofficeAdmin } from "@/lib/server/backoffice-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ authenticated: await isBackofficeAdmin(), configured: authConfigured() }, { headers: { "Cache-Control": "private, no-store" } });
}
