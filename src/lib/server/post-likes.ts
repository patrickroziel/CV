import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { getPublicNote } from "@/lib/server/notes-sharing";

export const likeCookie = "pr_post_reaction";
const VALID_ID = /^[a-zA-Z0-9_-]{1,120}$/;
const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
let schemaReady: Promise<void> | undefined;

function database() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL n'est pas définie");
  return neon(connectionString);
}
async function readyDatabase() {
  const sql = database();
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS portfolio_post_likes (
        post_id text NOT NULL,
        visitor_hash text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (post_id, visitor_hash)
      )`;
    })().catch(error => { schemaReady = undefined; throw error; });
  }
  await schemaReady;
  return sql;
}
export async function isPublishedPost(id: string) {
  if (!VALID_ID.test(id)) return false;
  try {
    return (await getPublicNote(id)) !== null;
  } catch {
    return false;
  }
}
export function tokenLooksValid(token: string | undefined) {
  return typeof token === "string" && TOKEN_PATTERN.test(token);
}
/** Token created randomly by the server. Hash varies per post and cannot be used to track a visitor across posts. */
export function visitorHash(postId: string, token: string) {
  return createHash("sha256").update("portfolio-like-v1:").update(postId).update(":").update(token).digest("hex");
}
export async function readLikes(id: string, hash: string | null) {
  const sql = await readyDatabase();
  const [countRow] = await sql`SELECT COUNT(*)::integer AS count FROM portfolio_post_likes WHERE post_id = ${id}`;
  const liked = hash ? (await sql`SELECT 1 FROM portfolio_post_likes WHERE post_id = ${id} AND visitor_hash = ${hash} LIMIT 1`).length > 0 : false;
  return { count: Number(countRow?.count ?? 0), liked };
}
export async function updateLike(id: string, hash: string, liked: boolean) {
  const sql = await readyDatabase();
  if (liked) {
    await sql`INSERT INTO portfolio_post_likes (post_id, visitor_hash) VALUES (${id}, ${hash}) ON CONFLICT DO NOTHING`;
  } else {
    await sql`DELETE FROM portfolio_post_likes WHERE post_id = ${id} AND visitor_hash = ${hash}`;
  }
  return readLikes(id, hash);
}
