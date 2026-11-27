import "server-only";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { normalizeGhostPages } from "@/lib/ghost-pages";
import { normalizeLightNotes } from "@/lib/lights";
import { concealHiddenPost } from "@/lib/post-publication";
import { readJsonBlob, writeJsonBlob } from "@/lib/server/json-blob";
import { DEFAULT_PORTFOLIO } from "@/lib/defaults";
import type { PortfolioData } from "@/lib/types";

type Snapshot = { data: PortfolioData | null; revision: number; savedAt: number; writeSeq: number };
type StoredContent = { revision: number; savedAt?: number; writeSeq?: number; data: PortfolioData };
export type PortfolioSource = "r2" | "snapshot";
export type LoadedPortfolio = { data: PortfolioData; revision: number; writeSeq: number; storage: PortfolioSource };

const PUBLIC_CACHE_TAG = "portfolio-public";
const CONTENT_KEY = "portfolio";

async function readContent(): Promise<Snapshot | null> {
  const stored = await readJsonBlob<StoredContent>(CONTENT_KEY);
  if (!stored?.data || typeof stored.revision !== "number") return null;
  return {
    data: stored.data,
    revision: stored.revision,
    savedAt: typeof stored.savedAt === "number" ? stored.savedAt : 0,
    writeSeq: typeof stored.writeSeq === "number" ? stored.writeSeq : 0,
  };
}

async function writeContent(data: PortfolioData, revision: number, savedAt: number, writeSeq: number) {
  const current = await readContent().catch(() => null);
  if (current && writeSeq < current.writeSeq) return;
  await writeJsonBlob(CONTENT_KEY, { revision, savedAt, writeSeq, data } satisfies StoredContent);
}

let inflight: Promise<Snapshot> | null = null;

function invalidatePublicPortfolio() {
  try {
    revalidateTag(PUBLIC_CACHE_TAG, { expire: 0 });
    revalidatePath("/api/portfolio");
    revalidatePath("/notes");
    revalidatePath("/air");
    revalidatePath("/lights");
    revalidatePath("/work");
    revalidatePath("/notes/[id]", "page");
    revalidatePath("/air/[id]", "page");
    revalidatePath("/g/[slug]", "page");
    revalidatePath("/sitemap.xml");
  } catch {
    // Best-effort outside a request.
  }
}

const readCachedPublicSnapshot = unstable_cache(
  async (): Promise<Snapshot> => {
    if (!inflight) {
      inflight = loadPortfolio()
        .then((loaded) => ({ data: loaded.data, revision: loaded.revision, savedAt: 0, writeSeq: loaded.writeSeq }))
        .catch(() => ({ data: DEFAULT_PORTFOLIO, revision: 1, savedAt: 0, writeSeq: 0 }))
        .finally(() => { inflight = null; });
    }
    return inflight;
  },
  ["portfolio-public-v1"],
  { revalidate: 300, tags: [PUBLIC_CACHE_TAG] }
);

/** Public pages share one cached snapshot. A save invalidates the tag immediately. */
export async function readPublicPortfolio(): Promise<Snapshot> {
  return readCachedPublicSnapshot();
}

/** The site content lives on Cloudflare R2. */
export async function loadPortfolio(): Promise<LoadedPortfolio> {
  let saved: Snapshot | null = null;
  try {
    saved = await readContent();
  } catch {
    saved = null;
  }
  if (saved?.data) {
    return { data: saved.data, revision: saved.revision, writeSeq: saved.writeSeq, storage: "r2" };
  }
  return { data: DEFAULT_PORTFOLIO, revision: 1, writeSeq: 0, storage: "snapshot" };
}

function safeRevision(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 2_000_000_000) return 0;
  return Math.floor(value);
}

export async function savePortfolio(data: PortfolioData, expectedRevision: number, writeSeq = 0): Promise<{ revision: number; writeSeq: number; stale: boolean }> {
  const requestedSeq = Number.isSafeInteger(writeSeq) && writeSeq > 0 ? writeSeq : 0;
  const current = await readContent().catch(() => null);
  const knownSeq = current?.writeSeq ?? 0;
  if (requestedSeq > 0 && requestedSeq < knownSeq) {
    return { revision: safeRevision(current?.revision ?? expectedRevision) || 1, writeSeq: knownSeq, stale: true };
  }
  const nextSeq = Math.max(requestedSeq, knownSeq + 1);
  const nextRevision = safeRevision(current?.revision ?? expectedRevision) + 1;
  const savedAt = Date.now();
  await writeContent(data, nextRevision, savedAt, nextSeq);
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
    lightNotes: normalizeLightNotes(data.lightNotes).filter((note) => note.visible),
  };
}
