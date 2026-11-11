import "server-only";

import { get, put, BlobPreconditionFailedError } from "@vercel/blob";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { normalizeGhostPages } from "@/lib/ghost-pages";
import { concealHiddenPost } from "@/lib/post-publication";
import type { PortfolioData } from "@/lib/types";

type Snapshot = { data: PortfolioData | null; revision: number };
type StoredSnapshot = { data: PortfolioData; revision: number };
type StoredWithTag = Snapshot & { etag: string | null };

const SNAPSHOT_KEY = "portfolio-private/content.json";
const PUBLIC_CACHE_TAG = "portfolio-public";
const PUBLIC_TTL_MS = 60_000;

function token() {
  return process.env.PRIVATE_BLOB_READ_WRITE_TOKEN?.trim() ?? "";
}

async function readStored(): Promise<StoredWithTag> {
  if (!token()) return { data: null, revision: 0, etag: null };
  const result = await get(SNAPSHOT_KEY, {
    access: "private",
    token: token(),
    useCache: false,
  });
  if (!result || result.statusCode === 404 || !result.stream) return { data: null, revision: 0, etag: null };
  if (result.statusCode !== 200) throw new Error("Lecture du stockage privé impossible.");
  const value = (await new Response(result.stream).json()) as Partial<StoredSnapshot>;
  if (!value.data || !Number.isSafeInteger(value.revision) || (value.revision ?? 0) < 1)
    throw new Error("Sauvegarde privée invalide.");
  return { data: value.data, revision: value.revision!, etag: result.etag };
}

/** Fresh read for authenticated administrators. */
export async function readPortfolio(): Promise<Snapshot> {
  const { data, revision } = await readStored();
  return { data, revision };
}

const shared = unstable_cache(
  () => readPortfolio(),
  ["portfolio-public-blob-v1"],
  { revalidate: 60, tags: [PUBLIC_CACHE_TAG] },
);
let memory: { at: number; snapshot: Snapshot } | null = null;
let inflight: Promise<Snapshot> | null = null;

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
    // Cache invalidation is best effort outside a request.
  }
}

/** Public callers still filter drafts before responding. */
export async function readPublicPortfolio(): Promise<Snapshot> {
  if (!token()) return { data: null, revision: 0 };
  if (memory && Date.now() - memory.at < PUBLIC_TTL_MS) return memory.snapshot;
  if (!inflight) {
    inflight = shared()
      .catch(() => readPortfolio())
      .then((snapshot) => {
        memory = { at: Date.now(), snapshot };
        return snapshot;
      })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

/** Optimistic write using a private Blob ETag, never overwriting a newer revision. */
export async function writePortfolio(data: PortfolioData, expectedRevision: number): Promise<number | null> {
  if (!token()) throw new Error("PRIVATE_BLOB_READ_WRITE_TOKEN manquant");
  const previous = await readStored();
  if (previous.revision !== expectedRevision) return null;
  const payload = JSON.stringify({ data, revision: expectedRevision + 1 } satisfies StoredSnapshot);
  try {
    await put(SNAPSHOT_KEY, payload, {
      access: "private",
      token: token(),
      contentType: "application/json",
      addRandomSuffix: false,
      ...(previous.etag
        ? { allowOverwrite: true, ifMatch: previous.etag }
        : { allowOverwrite: false }),
    });
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError ||
        /pathname.already.exists|already exists|precondition.failed|conflict/i.test(String(error))) return null;
    throw error;
  }
  invalidatePublicPortfolio();
  return expectedRevision + 1;
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
