import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { neon } from "@neondatabase/serverless";
import { normalizeGhostPages } from "@/lib/ghost-pages";
import { concealHiddenPost } from "@/lib/post-publication";
import { readJsonBlob, writeJsonBlob } from "@/lib/server/json-blob";
import { DEFAULT_PORTFOLIO } from "@/lib/defaults";
import type { PortfolioData } from "@/lib/types";

type Snapshot = { data: PortfolioData | null; revision: number };
type StoredContent = { revision: number; data: PortfolioData };
export type PortfolioSource = "neon" | "blob" | "snapshot";
export type LoadedPortfolio = { data: PortfolioData; revision: number; storage: PortfolioSource };

const PUBLIC_TTL_MS = 60_000;
const PUBLIC_CACHE_TAG = "portfolio-public";
const CONTENT_BLOB = "portfolio";

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

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
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

async function readContentBlob(): Promise<Snapshot | null> {
  const stored = await readJsonBlob<StoredContent>(CONTENT_BLOB);
  if (!stored?.data || typeof stored.revision !== "number") return null;
  return { data: stored.data, revision: stored.revision };
}

async function writeContentBlob(data: PortfolioData, revision: number) {
  await writeJsonBlob(CONTENT_BLOB, { revision, data } satisfies StoredContent);
}

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

/** Neon when it answers, otherwise the last copy kept outside Neon, otherwise the snapshot shipped with the site. */
export async function loadPortfolio(): Promise<LoadedPortfolio> {
  let neon: Snapshot | null = null;
  try {
    neon = await withTimeout(readPortfolio(), 2500);
  } catch {
    neon = null;
  }
  let saved: Snapshot | null = null;
  try {
    saved = await readContentBlob();
  } catch {
    saved = null;
  }
  if (saved?.data && saved.revision > (neon?.revision ?? 0)) {
    return { data: saved.data, revision: saved.revision, storage: "blob" };
  }
  if (neon?.data && neon.revision > 0) {
    return { data: neon.data, revision: neon.revision, storage: "neon" };
  }
  return { data: DEFAULT_PORTFOLIO, revision: 1, storage: "snapshot" };
}

/**
 * Public reads share one fetch per minute.
 * The raw snapshot can contain drafts: callers must filter before responding.
 */
export async function readPublicPortfolio(): Promise<Snapshot> {
  if (memory && Date.now() - memory.at < PUBLIC_TTL_MS) return memory.snapshot;
  if (!inflight) {
    inflight = loadPortfolio()
      .then((loaded) => remember({ data: loaded.data, revision: loaded.revision }))
      .catch(() => remember({ data: DEFAULT_PORTFOLIO, revision: 1 }))
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

async function mirrorPortfolio(data: PortfolioData, revision: number) {
  const sql = connection();
  if (!sql) return;
  await ensureTable();
  const payload = JSON.stringify(data);
  // Never roll Neon backwards. A newer blob is the copy the editor just loaded.
  await sql`INSERT INTO portfolio_content (id, payload, revision)
    VALUES (1, ${payload}::jsonb, ${revision})
    ON CONFLICT (id) DO UPDATE
    SET payload = EXCLUDED.payload, revision = EXCLUDED.revision, updated_at = now()
    WHERE portfolio_content.revision < EXCLUDED.revision`;
}

export async function savePortfolio(data: PortfolioData, expectedRevision: number): Promise<number | null> {
  const blob = await readContentBlob().catch(() => null);
  const blobRevision = blob?.revision ?? 0;
  let neonRevision = 0;
  try {
    const neon = await withTimeout(readPortfolio(), 2500);
    neonRevision = neon?.revision ?? 0;
  } catch {
    // Neon is over quota or unreachable. The blob copy must still accept the post.
    neonRevision = 0;
  }

  // The public site reads whichever copy is newer. The editor loaded that same head.
  // Comparing the client only to Neon rejects every save once the blob is ahead.
  const head = Math.max(blobRevision, neonRevision);
  const baseline = head === 0 && expectedRevision === 1 ? 1 : head;
  if (expectedRevision !== baseline) return null;

  const next = baseline + 1;
  await writeContentBlob(data, next);
  try {
    await withTimeout(mirrorPortfolio(data, next), 4000);
  } catch {
    // The post is already in the blob. A dead Neon must not report a failed save.
  }
  invalidatePublicPortfolio();
  return next;
}

export function publicPortfolio(data: PortfolioData): PortfolioData {
  return {
    ...data,
    socialPosts: (data.socialPosts ?? [])
      .filter((post) => post.visible !== false)
      .map((post) => concealHiddenPost(post)),
    ghostPages: normalizeGhostPages(data.ghostPages).filter((page) => page.visible),
  };
}
