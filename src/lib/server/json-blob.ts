import "server-only";

import { createHash } from "node:crypto";
import { get, put } from "@vercel/blob";

const chains = new Map<string, Promise<unknown>>();

function token() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() ?? "";
}

export function blobReady() {
  return token().length > 0;
}

function pathname(name: string) {
  const secret = process.env.BACKOFFICE_SESSION_SECRET?.trim() || token() || "patrickroziel";
  const folder = createHash("sha256").update(`portfolio-store-v1:${secret}`).digest("hex").slice(0, 32);
  return `stores/${folder}/${name}.json`;
}

export function enqueue<T>(key: string, job: () => Promise<T>): Promise<T> {
  const previous = chains.get(key) ?? Promise.resolve();
  const run = previous.then(job, job);
  chains.set(key, run.then(() => undefined, () => undefined));
  return run;
}

async function readOnce<T>(path: string, access: "private" | "public"): Promise<T | null> {
  const file = await get(path, { access, token: token(), useCache: false });
  if (!file || file.statusCode !== 200 || !file.stream) return null;
  return JSON.parse(await new Response(file.stream).text()) as T;
}

export async function readJsonBlob<T>(name: string): Promise<T | null> {
  if (!blobReady()) return null;
  const path = pathname(name);
  try {
    return await readOnce<T>(path, "private");
  } catch {
    try {
      return await readOnce<T>(path, "public");
    } catch {
      return null;
    }
  }
}

export async function writeJsonBlob(name: string, value: unknown) {
  if (!blobReady()) throw new Error("Stockage de secours indisponible.");
  const path = pathname(name);
  const body = JSON.stringify(value);
  const options = {
    token: token(),
    addRandomSuffix: false as const,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  };
  try {
    await put(path, body, { ...options, access: "private" });
  } catch {
    await put(path, body, { ...options, access: "public" });
  }
}
