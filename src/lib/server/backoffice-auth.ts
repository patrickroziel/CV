import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// GitHub account ID, not a username that could be reassigned.
const ADMIN_GITHUB_ID = "307225840";
const SESSION_COOKIE = "pr_backoffice_session";
export const OAUTH_STATE_COOKIE = "pr_backoffice_oauth_state";
const SESSION_TTL = 60 * 60 * 24 * 7;

export function privatePath() {
  const slug = process.env.BACKOFFICE_SLUG?.trim();
  return slug ? `/behind-the-glass/${encodeURIComponent(slug)}` : "/";
}
/**
 * Report only the names of invalid setup variables, never their values.
 * Temporary aid for Vercel initial deployment troubleshooting.
 */
export function backofficeConfigurationIssues(): string[] {
  const issues: string[] = [];
  const { BACKOFFICE_SLUG, BACKOFFICE_SESSION_SECRET, BACKOFFICE_BASE_URL, GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET } = process.env;
  try {
    const url = new URL(BACKOFFICE_BASE_URL?.trim() ?? "");
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
      issues.push("BACKOFFICE_BASE_URL");
    }
  } catch { issues.push("BACKOFFICE_BASE_URL"); }

  if (!BACKOFFICE_SLUG || !/^[A-Za-z0-9_-]{24,}$/.test(BACKOFFICE_SLUG)) issues.push("BACKOFFICE_SLUG");
  if (!BACKOFFICE_SESSION_SECRET || BACKOFFICE_SESSION_SECRET.length < 32) issues.push("BACKOFFICE_SESSION_SECRET");
  if (!GITHUB_OAUTH_CLIENT_ID?.trim()) issues.push("GITHUB_OAUTH_CLIENT_ID");
  if (!GITHUB_OAUTH_CLIENT_SECRET?.trim()) issues.push("GITHUB_OAUTH_CLIENT_SECRET");
  return issues;
}
export function authConfigured() {
  return backofficeConfigurationIssues().length === 0;
}
function signingKey() {
  const key = process.env.BACKOFFICE_SESSION_SECRET;
  if (!key || key.length < 32) throw new Error("BACKOFFICE_SESSION_SECRET doit contenir au moins 32 caractères");
  return key;
}
function mac(payload: string) {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}
export function adminSession(githubId: number) {
  if (String(githubId) !== ADMIN_GITHUB_ID) throw new Error("Compte non autorisé");
  const payload = Buffer.from(JSON.stringify({ id: ADMIN_GITHUB_ID, expires: Math.floor(Date.now() / 1000) + SESSION_TTL })).toString("base64url");
  return `v1.${payload}.${mac(`v1.${payload}`)}`;
}
function verifySession(session?: string) {
  if (!session || !authConfigured()) return false;
  try {
    const pieces = session.split(".");
    if (pieces.length !== 3 || pieces[0] !== "v1") return false;
    const expected = Buffer.from(mac(`${pieces[0]}.${pieces[1]}`), "base64url");
    const actual = Buffer.from(pieces[2], "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
    const parsed = JSON.parse(Buffer.from(pieces[1], "base64url").toString("utf8")) as { id?: string; expires?: number };
    return parsed.id === ADMIN_GITHUB_ID && typeof parsed.expires === "number" && parsed.expires > Date.now() / 1000;
  } catch { return false; }
}
export async function isBackofficeAdmin() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}
export function setSessionCookie(response: NextResponse, githubId: number) {
  response.cookies.set(SESSION_COOKIE, adminSession(githubId), {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: SESSION_TTL,
  });
}
export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 0,
  });
}
export function createOAuthState() { return randomBytes(32).toString("base64url"); }
export function validateOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}
export function oauthCallbackUrl(_request: Request) {
  // Explicitly configured production URL, never trust X-Forwarded-Host from untrusted requests.
  if (!authConfigured()) throw new Error("Configuration OAuth incomplète");
  return new URL("/api/backoffice/callback", process.env.BACKOFFICE_BASE_URL).toString();
}
