import { createHmac } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { DEFAULT_PORTFOLIO } from "@/lib/defaults";
import { readPortfolio } from "@/lib/server/portfolio-db";

const COOKIE = "pr_post_reaction";
const VALID_ID = /^[a-zA-Z0-9_-]{1,120}$/;

function database() { return process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null; }
let prepared: Promise<void> | undefined;
async function prepare() {
  const sql = database();
  if (!sql) throw new Error("Base Neon non configurée");
  if (!prepared) {
    prepared = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS portfolio_post_likes (
        post_id text NOT NULL,
        visitor_hash text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (post_id, visitor_hash)
      )`;
    })().catch(error => { prepared = undefined; throw error; });
  }
  await prepared;
  return sql;
}
export async function isPublishedPost(postId: string) {
  if (!VALID_ID.test(postId)) return false;
  const snapshot = await readPortfolio();
  const posts = snapshot.data?.socialPosts ?? DEFAULT_PORTFOLIO.socialPosts ?? [];
  return posts.some(post => post.id === postId && post.visible !== false);
}
export function visitorHash(token: string) {
  const secret = process.env.BACKOFFICE_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return createHmac("sha256", secret).update("likes:v1:" + token).digest("hex");
}
export function tokenLooksValid(value?: string) { return !!value && /^[a-f0-9]{64}$/.test(value); }
export { COOKIE as likeCookie };
export async function likeState(id: string, hash?: string | null) {
  const sql = await prepare();
  const rows = await sql`SELECT COUNT(*)::integer AS count FROM portfolio_post_likes WHERE post_id = ${id}`;
  let liked = false;
  if (hash) {
    const current = await sql`SELECT 1 FROM portfolio_post_likes WHERE post_id = ${id} AND visitor_hash = ${hash} LIMIT 1`;
    liked = current.length > 0;
  }
  return { count: Number(rows[0]?.count ?? 0), liked };
}
export async function setLike(id: string, hash: string, liked: boolean) {
  const sql = await prepare();
  if (liked) {
    await sql`INSERT INTO portfolio_post_likes (post_id, visitor_hash) VALUES (${id}, ${hash}) ON CONFLICT DO NOTHING`;
  } else {
    await sql`DELETE FROM portfolio_post_likes WHERE post_id = ${id} AND visitor_hash = ${hash}`;
  }
  return likeState(id, hash);
}
