import { NextResponse, type NextRequest } from "next/server";
import { shareLanguageFromParam } from "@/lib/site-translation";

const PREVIEW_BOT = /twitterbot|facebookexternalhit|facebot|linkedinbot|slackbot|telegrambot|whatsapp|discordbot|pinterest|embedly|iframely|redditbot/i;

export function middleware(request: NextRequest) {
  const lang = shareLanguageFromParam(request.nextUrl.searchParams.get("lang"));
  if (!lang || !PREVIEW_BOT.test(request.headers.get("user-agent") || "")) return NextResponse.next();
  const match = request.nextUrl.pathname.match(/^\/(notes|air)\/([^/]+)$/);
  if (!match) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/api/share-preview";
  url.search = "";
  url.searchParams.set("kind", match[1]);
  url.searchParams.set("id", decodeURIComponent(match[2]));
  url.searchParams.set("lang", lang);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/notes/:id", "/air/:id"],
};
