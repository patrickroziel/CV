import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { authConfigured, oauthCallbackUrl, OAUTH_STATE_COOKIE, privatePath, setSessionCookie } from "@/lib/server/backoffice-auth";

export const runtime = "nodejs";
function equal(a: string, b: string) {
  const aa = Buffer.from(a), bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const expected = request.cookies.get(OAUTH_STATE_COOKIE)?.value ?? "";
  if (!authConfigured() || !code || !state || !expected || !equal(state, expected))
    return NextResponse.json({ error: "Connexion GitHub rejetée" }, { status: 403 });

  try {
    const exchange = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
        client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
        code, redirect_uri: oauthCallbackUrl(request),
      }),
      cache: "no-store",
    });
    if (!exchange.ok) throw new Error("Échange OAuth indisponible");
    const authorization = await exchange.json() as { access_token?: string };
    if (!authorization.access_token)
      return NextResponse.json({ error: "Autorisation refusée" }, { status: 403 });
    const github = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${authorization.access_token}`, Accept: "application/vnd.github+json", "User-Agent": "patrick-roziel-backoffice" },
      cache: "no-store",
    });
    if (!github.ok) throw new Error("Identité invérifiable");
    const user = await github.json() as { id?: number; login?: string };
    if (user.id !== 307225840 || user.login?.toLowerCase() !== "patrickroziel")
      return NextResponse.json({ error: "Compte administrateur non autorisé" }, { status: 403 });

    const response = NextResponse.redirect(new URL(privatePath(), request.url));
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/api/backoffice", maxAge: 0 });
    setSessionCookie(response, user.id);
    return response;
  } catch {
    return NextResponse.json({ error: "Authentification temporairement indisponible" }, { status: 502 });
  }
}
