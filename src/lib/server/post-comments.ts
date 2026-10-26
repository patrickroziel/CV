import "server-only";

import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { getPublicNote } from "@/lib/server/notes-sharing";

export type PostComment = {
  id: string;
  post_id: string;
  author_name: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

let schemaReady: Promise<void> | undefined;
function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL n'est pas configurée");
  return neon(url);
}
async function readyDatabase() {
  const sql = database();
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS portfolio_post_comments (
        id text PRIMARY KEY,
        post_id text NOT NULL,
        author_name text NOT NULL,
        body text NOT NULL,
        status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at timestamptz NOT NULL DEFAULT now()
      )`;
      await sql`CREATE INDEX IF NOT EXISTS portfolio_post_comments_public_idx
        ON portfolio_post_comments (post_id, status, created_at)`;
    })().catch(error => { schemaReady = undefined; throw error; });
  }
  await schemaReady;
  return sql;
}
export async function isCommentablePost(id: string) {
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(id)) return false;
  const post = await getPublicNote(id);
  return !!post && post.universe !== "air";
}
export async function listApprovedComments(postId: string) {
  const sql = await readyDatabase();
  return await sql`SELECT id, post_id, author_name, body, status, created_at
    FROM portfolio_post_comments
    WHERE post_id = ${postId} AND status = 'approved'
    ORDER BY created_at ASC LIMIT 200` as unknown as PostComment[];
}
export async function submitComment(postId: string, authorName: string, body: string) {
  const sql = await readyDatabase();
  const id = randomUUID();
  await sql`INSERT INTO portfolio_post_comments (id, post_id, author_name, body, status)
    VALUES (${id}, ${postId}, ${authorName}, ${body}, 'pending')`;
  return id;
}
export async function listModerationComments() {
  const sql = await readyDatabase();
  return await sql`SELECT id, post_id, author_name, body, status, created_at
    FROM portfolio_post_comments
    ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, created_at DESC
    LIMIT 500` as unknown as PostComment[];
}
export async function moderateComment(id: string, action: "approve" | "reject" | "delete") {
  const sql = await readyDatabase();
  if (action === "delete") {
    await sql`DELETE FROM portfolio_post_comments WHERE id = ${id}`;
    return;
  }
  await sql`UPDATE portfolio_post_comments SET status = ${action === "approve" ? "approved" : "rejected"} WHERE id = ${id}`;
}
