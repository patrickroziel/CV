import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { neon } from "@neondatabase/serverless";
import { getPublicNote } from "@/lib/server/notes-sharing";

export const likeCookie = "pr_post_reaction";
const VALID_ID = /^[a-zA-Z0-9_-]{1,120}$/;
const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const MAX_BATCH = 60;
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

/**
 * Published ids only. The full portfolio JSON stays out of this path:
 * a likes check must not transfer every article.
 */
const publishedIds = unstable_cache(async () => {
  const sql = await readyDatabase();
  const rows = await sql`
    SELECT post->>'id' AS id
    FROM portfolio_content,
         LATERAL jsonb_array_elements(COALESCE(payload->'socialPosts', '[]'::jsonb)) AS post
    WHERE portfolio_content.id = 1
      AND COALESCE(post->>'visible', 'true') <> 'false'
      AND COALESCE(post->>'id', '') <> ''
  `;
  return rows
    .map((row) => String(row.id))
    .filter((id) => VALID_ID.test(id));
}, ["published-post-ids-v1"], { revalidate: 60, tags: ["portfolio-public"] });

export function cleanPostIds(ids: string[]) {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (!VALID_ID.test(id) || seen.has(id)) continue;
    seen.add(id);
    unique.push(id);
    if (unique.length >= MAX_BATCH) break;
  }
  return unique;
}

export async function publishedIdSet() {
  if (!process.env.DATABASE_URL) return null;
  try {
    return new Set(await publishedIds());
  } catch {
    return null;
  }
}

export async function isPublishedPost(id: string) {
  if (!VALID_ID.test(id)) return false;
  if (!process.env.DATABASE_URL) {
    try { return (await getPublicNote(id)) !== null; } catch { return false; }
  }
  try {
    return (await publishedIds()).includes(id);
  } catch {
    try { return (await getPublicNote(id)) !== null; } catch { return false; }
  }
}

export function tokenLooksValid(token: string | undefined) {
  return typeof token === "string" && TOKEN_PATTERN.test(token);
}

/** Token created randomly by the server. Hash varies per post and cannot be used to track a visitor across posts. */
export function visitorHash(postId: string, token: string) {
  return createHash("sha256").update("portfolio-like-v1:").update(postId).update(":").update(token).digest("hex");
}

export type LikeState = { count: number; liked: boolean };

export async function readLikes(id: string, hash: string | null): Promise<LikeState> {
  const states = await readLikeStates([id], hash ? { [id]: hash } : {});
  return states[id] ?? { count: 0, liked: false };
}

/** One round-trip for every heart on the page. */
export async function readLikeStates(ids: string[], hashes: Record<string, string>): Promise<Record<string, LikeState>> {
  const unique = cleanPostIds(ids);
  const result: Record<string, LikeState> = {};
  for (const id of unique) result[id] = { count: 0, liked: false };
  if (!unique.length) return result;
  const sql = await readyDatabase();
  const hashList = unique.map((id) => hashes[id]).filter((hash): hash is string => Boolean(hash));
  const rows = await sql.query(
    `SELECT post_id,
            COUNT(*)::int AS count,
            COALESCE(BOOL_OR(visitor_hash = ANY($2::text[])), false) AS liked
     FROM portfolio_post_likes
     WHERE post_id = ANY($1::text[])
     GROUP BY post_id`,
    [unique, hashList],
  );
  for (const row of rows) {
    const id = String(row.post_id);
    if (!result[id]) continue;
    result[id] = { count: Number(row.count) || 0, liked: row.liked === true };
  }
  return result;
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
