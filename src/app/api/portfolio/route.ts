import { NextResponse } from "next/server";
import { DEFAULT_PORTFOLIO } from "@/lib/defaults";
import { readPortfolio, publicPortfolio } from "@/lib/server/portfolio-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const result = await readPortfolio();
    return NextResponse.json({ data: publicPortfolio(result.data ?? DEFAULT_PORTFOLIO) }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ data: publicPortfolio(DEFAULT_PORTFOLIO), fallback: true }, {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
