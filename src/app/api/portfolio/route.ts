import { NextResponse } from "next/server";
import { DEFAULT_PORTFOLIO } from "@/lib/defaults";
import { publicPortfolio, readPublicPortfolio } from "@/lib/server/portfolio-db";

export const runtime = "nodejs";
export const revalidate = 0;

const cacheHeaders = {
  "Cache-Control": "private, no-store",
};

export async function GET() {
  try {
    const result = await readPublicPortfolio();
    return NextResponse.json({ data: publicPortfolio(result.data ?? DEFAULT_PORTFOLIO) }, {
      headers: cacheHeaders,
    });
  } catch {
    return NextResponse.json({ data: publicPortfolio(DEFAULT_PORTFOLIO), fallback: true }, {
      headers: { "Cache-Control": "public, max-age=15, s-maxage=15" },
    });
  }
}
