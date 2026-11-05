import "server-only";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { neon } from "@neondatabase/serverless";
import { normalizeGhostPages } from "@/lib/ghost-pages";
import type { PortfolioData } from "@/lib/types";

type Snapshot = { data: PortfolioData | null; revision: number };

const PUBLIC_TTL_MS = 60_000;
const PUBLIC_CACHE_TAG = "portfolio-public";

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

/** Fresh read for the back-office. Do not use this on public traffic. */
export async function readPortfolio(): Promise<Snapshot> {
  const sql = connection();
  if (!sql) return { data: null, revision: 0 };
  await ensureTable();
  const rows = await sql`SELECT payload, revision FROM portfolio_content WHERE id = 1 LIMIT 1`;
  if (!rows.length) return { data: null, revision: 0 };
  return { data: rows[0].payload as PortfolioData, revision: Number(rows[0].revision) };
}

const readPortfolioShared = unstable_cache(
  async () => readPortfolio(),
  ["portfolio-public-v1"],
  { revalidate: 60, tags: [PUBLIC_CACHE_TAG] },
);

let memory: { at: number; snapshot: Snapshot } | null = null;
let inflight: Promise<Snapshot> | null = null;

function remember(snapshot: Snapshot) {
  memory = { at: Date.now(), snapshot };
  return snapshot;
}

function invalidatePublicPortfolio() {
  memory = null;
  try {
    revalidateTag(PUBLIC_CACHE_TAG, { expire: 0 });
    revalidatePath("/api/portfolio");
    revalidatePath("/notes");
    revalidatePath("/air");
    revalidatePath("/notes/[id]", "page");
    revalidatePath("/air/[id]", "page");
    revalidatePath("/g/[slug]", "page");
    revalidatePath("/sitemap.xml");
  } catch {
    // Best-effort outside a request. The memory cache is already cleared.
  }
}

/**
 * Public reads share one Neon fetch per minute.
 * The raw snapshot can contain drafts: callers must filter before responding.
 */
export async function readPublicPortfolio(): Promise<Snapshot> {
  if (!process.env.DATABASE_URL) return { data: null, revision: 0 };
  if (memory && Date.now() - memory.at < PUBLIC_TTL_MS) return memory.snapshot;
  if (!inflight) {
    inflight = readPortfolioShared()
      .then((snapshot) => remember(snapshot))
      .catch(() => readPortfolio().then((snapshot) => remember(snapshot)))
      .finally(() => { inflight = null; });
  }
  return inflight;
}

export async function writePortfolio(data: PortfolioData, expectedRevision: number): Promise<number | null> {
  const sql = connection();
  if (!sql) throw new Error("DATABASE_URL manquante");
  await ensureTable();
  const payload = JSON.stringify(data);
  if (expectedRevision === 0) {
    const rows = await sql`INSERT INTO portfolio_content (id, payload, revision)
      VALUES (1, ${payload}::jsonb, 1) ON CONFLICT (id) DO NOTHING RETURNING revision`;
    if (!rows.length) return null;
    invalidatePublicPortfolio();
    return Number(rows[0].revision);
  }
  const rows = await sql`UPDATE portfolio_content
    SET payload = ${payload}::jsonb, revision = revision + 1, updated_at = now()
    WHERE id = 1 AND revision = ${expectedRevision} RETURNING revision`;
  if (!rows.length) return null;
  invalidatePublicPortfolio();
  return Number(rows[0].revision);
}
export function publicPortfolio(data: PortfolioData): PortfolioData {
  return {
    ...data,
    socialPosts: (data.socialPosts ?? []).filter((post) => post.visible !== false),
    ghostPages: normalizeGhostPages(data.ghostPages).filter((page) => page.visible),
  };
}
