import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { neon } from "@neondatabase/serverless";
import { normalizeGhostPages } from "@/lib/ghost-pages";
import { concealHiddenPost } from "@/lib/post-publication";
import { readJsonBlob, writeJsonBlob } from "@/lib/server/json-blob";
import { DEFAULT_PORTFOLIO } from "@/lib/defaults";
import type { PortfolioData } from "@/lib/types";

type Snapshot = { data: PortfolioData | null; revision: number; savedAt: number; writeSeq: number };
type StoredContent = { revision: number; savedAt?: number; writeSeq?: number; data: PortfolioData };
export type PortfolioSource = "neon" | "blob" | "snapshot";
export type LoadedPortfolio = { data: PortfolioData; revision: number; writeSeq: number; storage: PortfolioSource };

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
      try {
        await sql`ALTER TABLE portfolio_content ALTER COLUMN revision TYPE bigint`;
        await sql`ALTER TABLE portfolio_content ADD COLUMN IF NOT EXISTS write_seq bigint NOT NULL DEFAULT 0`;
      } catch {
        // Neon can be full. The blob copy still keeps the site.
      }
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
  if (!sql) return { data: null, revision: 0, savedAt: 0, writeSeq: 0 };
  await ensureTable();
  try {
    const rows = await sql`SELECT payload, revision, updated_at, write_seq FROM portfolio_content WHERE id = 1 LIMIT 1`;
    if (!rows.length) return { data: null, revision: 0, savedAt: 0, writeSeq: 0 };
    return {
      data: rows[0].payload as PortfolioData,
      revision: Number(rows[0].revision) || 0,
      savedAt: new Date(rows[0].updated_at as string).getTime() || 0,
      writeSeq: Number(rows[0].write_seq) || 0,
    };
  } catch {
    const rows = await sql`SELECT payload, revision, updated_at FROM portfolio_content WHERE id = 1 LIMIT 1`;
    if (!rows.length) return { data: null, revision: 0, savedAt: 0, writeSeq: 0 };
    return {
      data: rows[0].payload as PortfolioData,
      revision: Number(rows[0].revision) || 0,
      savedAt: new Date(rows[0].updated_at as string).getTime() || 0,
      writeSeq: 0,
    };
  }
}

async function readContentBlob(): Promise<Snapshot | null> {
  const stored = await readJsonBlob<StoredContent>(CONTENT_BLOB);
  if (!stored?.data || typeof stored.revision !== "number") return null;
  return {
    data: stored.data,
    revision: stored.revision,
    savedAt: typeof stored.savedAt === "number" ? stored.savedAt : 0,
    writeSeq: typeof stored.writeSeq === "number" ? stored.writeSeq : 0,
  };
}

async function writeContentBlob(data: PortfolioData, revision: number, savedAt: number, writeSeq: number) {
  const current = await readContentBlob().catch(() => null);
  if (current && writeSeq < current.writeSeq) return;
  await writeJsonBlob(CONTENT_BLOB, { revision, savedAt, writeSeq, data } satisfies StoredContent);
}

let inflight: Promise<Snapshot> | null = null;

function invalidatePublicPortfolio() {
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

function preferFresh(blob: Snapshot | null, neon: Snapshot | null): Snapshot | null {
  if (!blob?.data) return neon?.data ? neon : null;
  if (!neon?.data) return blob;
  if (blob.savedAt !== neon.savedAt) return blob.savedAt > neon.savedAt ? blob : neon;
  if (blob.writeSeq !== neon.writeSeq) return blob.writeSeq > neon.writeSeq ? blob : neon;
  return blob.revision >= neon.revision ? blob : neon;
}

/** Neon when it answers, otherwise the last copy kept outside Neon, otherwise the snapshot shipped with the site. */
export async function loadPortfolio(): Promise<LoadedPortfolio> {
  let neon: Snapshot | null = null;
  try {
    neon = await withTimeout(readPortfolio(), 1500);
  } catch {
    neon = null;
  }
  let saved: Snapshot | null = null;
  try {
    saved = await readContentBlob();
  } catch {
    saved = null;
  }
  const chosen = preferFresh(saved, neon);
  if (chosen?.data) {
    const storage: PortfolioSource = chosen === saved ? "blob" : "neon";
    return { data: chosen.data, revision: chosen.revision, writeSeq: chosen.writeSeq, storage };
  }
  return { data: DEFAULT_PORTFOLIO, revision: 1, writeSeq: 0, storage: "snapshot" };
}

/** Public reads must not reuse a process cache: a save on another instance would stay invisible. */
export async function readPublicPortfolio(): Promise<Snapshot> {
  if (!inflight) {
    inflight = loadPortfolio()
      .then((loaded) => ({ data: loaded.data, revision: loaded.revision, savedAt: 0, writeSeq: loaded.writeSeq }))
      .catch(() => ({ data: DEFAULT_PORTFOLIO, revision: 1, savedAt: 0, writeSeq: 0 }))
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

async function mirrorPortfolio(data: PortfolioData, revision: number, writeSeq: number) {
  const sql = connection();
  if (!sql) return;
  await ensureTable();
  const payload = JSON.stringify(data);
  const updated = await sql`UPDATE portfolio_content
    SET payload = ${payload}::jsonb, revision = ${revision}, write_seq = ${writeSeq}, updated_at = now()
    WHERE id = 1 AND write_seq <= ${writeSeq} RETURNING revision`;
  if (updated.length) return;
  const existing = await sql`SELECT write_seq FROM portfolio_content WHERE id = 1 LIMIT 1`;
  if (existing.length) return;
  await sql`INSERT INTO portfolio_content (id, payload, revision, write_seq)
    VALUES (1, ${payload}::jsonb, ${revision}, ${writeSeq})
    ON CONFLICT (id) DO UPDATE
    SET payload = EXCLUDED.payload, revision = EXCLUDED.revision, write_seq = EXCLUDED.write_seq, updated_at = now()
    WHERE portfolio_content.write_seq <= EXCLUDED.write_seq`;
}

function safeRevision(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 2_000_000_000) return 0;
  return Math.floor(value);
}

export async function savePortfolio(data: PortfolioData, expectedRevision: number, writeSeq = 0): Promise<{ revision: number; writeSeq: number; stale: boolean }> {
  const requestedSeq = Number.isSafeInteger(writeSeq) && writeSeq > 0 ? writeSeq : 0;
  let knownSeq = 0;
  let neonRevision = 0;
  try {
    const blob = await readContentBlob();
    knownSeq = Math.max(knownSeq, blob?.writeSeq ?? 0);
  } catch { /* The blob can be missing on the first save. */ }
  try {
    const neon = await withTimeout(readPortfolio(), 1200);
    knownSeq = Math.max(knownSeq, neon?.writeSeq ?? 0);
    neonRevision = safeRevision(neon?.revision ?? 0);
  } catch { /* Neon down must not block the save. */ }

  if (requestedSeq > 0 && requestedSeq < knownSeq) {
    return { revision: Math.max(neonRevision, 1), writeSeq: knownSeq, stale: true };
  }
  const nextSeq = Math.max(requestedSeq, knownSeq + 1, safeRevision(expectedRevision) + 1);
  const nextRevision = Math.max(neonRevision, safeRevision(expectedRevision)) + 1;
  const savedAt = Date.now();

  let blobOk = false;
  let neonOk = false;
  let blobError: unknown = null;
  let neonError: unknown = null;
  try {
    await writeContentBlob(data, nextRevision, savedAt, nextSeq);
    blobOk = true;
  } catch (error) {
    blobError = error;
  }
  try {
    await withTimeout(mirrorPortfolio(data, nextRevision, nextSeq), 2000);
    neonOk = true;
  } catch (error) {
    neonError = error;
  }
  if (!blobOk && !neonOk) {
    console.error("portfolio save failed", blobError, neonError);
    throw blobError instanceof Error ? blobError : new Error("Sauvegarde impossible.");
  }
  if (!blobOk) console.error("portfolio blob unavailable", blobError);
  if (!neonOk) console.error("portfolio neon unavailable", neonError);
  invalidatePublicPortfolio();
  return { revision: nextRevision, writeSeq: nextSeq, stale: false };
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
