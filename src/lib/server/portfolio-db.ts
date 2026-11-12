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

export async function savePortfolio(data: PortfolioData, expectedRevision: number): Promise<number | null> {
  try {
    const next = await withTimeout(writePortfolio(data, expectedRevision), 4000);
    if (next !== null) {
      await writeContentBlob(data, next).catch(() => undefined);
      return next;
    }
    const fresh = await withTimeout(readPortfolio(), 2500);
    if (fresh.revision > 0) return null;
  } catch {
    // Neon is over quota or unreachable. Keep editing on the backup copy.
  }
  const current = await readContentBlob();
  const currentRevision = current?.revision ?? 0;
  if (current && currentRevision !== expectedRevision) return null;
  const next = (current ? currentRevision : Math.max(expectedRevision, 0)) + 1;
  await writeContentBlob(data, next);
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
