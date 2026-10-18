import { NextResponse } from "next/server";
import { authConfigured, backofficeConfigurationIssues, isBackofficeAdmin } from "@/lib/server/backoffice-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const configured = authConfigured();
  return NextResponse.json({
    authenticated: await isBackofficeAdmin(),
    configured,
    ...(!configured ? { invalidVariables: backofficeConfigurationIssues() } : {}),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
