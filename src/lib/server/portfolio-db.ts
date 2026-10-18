import { neon } from "@neondatabase/serverless";
import type { PortfolioData } from "@/lib/types";

type Snapshot = { data: PortfolioData | null; revision: number };
function connection() {
  const url = process.env.DATABASE_URL;
  return url ? neon(url) : null;
}
let initialized: Promise<void> | undefined;
async function ensureTable() {
  const sql = connection();
  if (!sql) return;
  if (!initialized) {
    initialized = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS portfolio_content (
        id integer PRIMARY KEY CHECK (id = 1),
        payload jsonb NOT NULL,
        revision integer NOT NULL DEFAULT 1,
        updated_at timestamptz NOT NULL DEFAULT now()
      )`;
    })().catch((error) => { initialized = undefined; throw error; });
  }
  await initialized;
}
export async function readPortfolio(): Promise<Snapshot> {
  const sql = connection();
  if (!sql) return { data: null, revision: 0 };
  await ensureTable();
  const rows = await sql`SELECT payload, revision FROM portfolio_content WHERE id = 1 LIMIT 1`;
  if (!rows.length) return { data: null, revision: 0 };
  return { data: rows[0].payload as PortfolioData, revision: Number(rows[0].revision) };
}
export async function writePortfolio(data: PortfolioData, expectedRevision: number): Promise<number | null> {
  const sql = connection();
  if (!sql) throw new Error("DATABASE_URL manquante");
  await ensureTable();
  const payload = JSON.stringify(data);
  if (expectedRevision === 0) {
    const rows = await sql`INSERT INTO portfolio_content (id, payload, revision)
      VALUES (1, ${payload}::jsonb, 1) ON CONFLICT (id) DO NOTHING RETURNING revision`;
    return rows.length ? Number(rows[0].revision) : null;
  }
  const rows = await sql`UPDATE portfolio_content
    SET payload = ${payload}::jsonb, revision = revision + 1, updated_at = now()
    WHERE id = 1 AND revision = ${expectedRevision} RETURNING revision`;
  return rows.length ? Number(rows[0].revision) : null;
}
export function publicPortfolio(data: PortfolioData): PortfolioData {
  return { ...data, socialPosts: (data.socialPosts ?? []).filter((post) => post.visible !== false) };
}
