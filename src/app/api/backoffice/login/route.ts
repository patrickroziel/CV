import { NextRequest, NextResponse } from "next/server";
import { authConfigured, createOAuthState, oauthCallbackUrl, OAUTH_STATE_COOKIE } from "@/lib/server/backoffice-auth";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  if (!authConfigured()) return NextResponse.json({ error: "Connexion privée non configurée" }, { status: 503 });
  const state = createOAuthState();
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.GITHUB_OAUTH_CLIENT_ID!);
  url.searchParams.set("redirect_uri", oauthCallbackUrl(request));
  url.searchParams.set("state", state);
  url.searchParams.set("allow_signup", "false");
  // No repo scope: the OAuth login verifies identity, never accesses private repositories.
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/api/backoffice", maxAge: 600,
  });
  return response;
}
