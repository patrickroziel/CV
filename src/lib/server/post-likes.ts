import "server-only";

import { createHash } from "node:crypto";
import { get, put, BlobPreconditionFailedError } from "@vercel/blob";
import { getPublicNote, listPublicPosts } from "@/lib/server/notes-sharing";

export const likeCookie = "pr_post_reaction";
const VALID_ID = /^[a-zA-Z0-9_-]{1,120}$/;
const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const MAX_BATCH = 60;
const HASH_PATTERN = /^[a-f0-9]{64}$/;

function token() {
  const value = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN?.trim();
  if (!value) throw new Error("Stockage privé non configuré");
  return value;
}
function pathFor(id: string) {
  if (!VALID_ID.test(id)) throw new Error("Identifiant de publication invalide");
  return `portfolio-private/likes/${id}.json`;
}

type LikesRecord = { hashes: string[]; etag: string | null };

async function readRecord(id: string): Promise<LikesRecord> {
  const result = await get(pathFor(id), { access: "private", token: token(), useCache: false });
  if (!result || result.statusCode === 404 || !result.stream) return { hashes: [], etag: null };
  if (result.statusCode !== 200) throw new Error("Lecture des réactions impossible");
  const parsed = (await new Response(result.stream).json()) as { hashes?: unknown };
  if (!Array.isArray(parsed.hashes) || parsed.hashes.some((hash) => typeof hash !== "string" || !HASH_PATTERN.test(hash)))
    throw new Error("Réactions stockées invalides");
  return { hashes: parsed.hashes, etag: result.etag };
}

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
  try {
    return new Set((await listPublicPosts())
      .map((post) => post.id)
      .filter((id) => VALID_ID.test(id)));
  } catch {
    return null;
  }
}

export async function isPublishedPost(id: string) {
  if (!VALID_ID.test(id)) return false;
  try { return (await getPublicNote(id)) !== null; }
  catch { return false; }
}

export function tokenLooksValid(value: string | undefined) {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

export function visitorHash(postId: string, value: string) {
  return createHash("sha256").update("portfolio-like-v1:").update(postId).update(":").update(value).digest("hex");
}

export type LikeState = { count: number; liked: boolean };

export async function readLikes(id: string, hash: string | null): Promise<LikeState> {
  const record = await readRecord(id);
  return { count: record.hashes.length, liked: Boolean(hash && record.hashes.includes(hash)) };
}

export async function readLikeStates(ids: string[], hashes: Record<string, string>): Promise<Record<string, LikeState>> {
  const states = await Promise.all(cleanPostIds(ids).map(async (id) => {
    const state = await readLikes(id, hashes[id] || null);
    return [id, state] as const;
  }));
  return Object.fromEntries(states);
}

export async function updateLike(id: string, hash: string, liked: boolean) {
  if (!HASH_PATTERN.test(hash)) throw new Error("Réaction invalide");
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const previous = await readRecord(id);
    const next = liked
      ? [...new Set([...previous.hashes, hash])]
      : previous.hashes.filter((value) => value !== hash);
    if (next.length === previous.hashes.length) {
      return { count: next.length, liked: next.includes(hash) };
    }
    try {
      await put(pathFor(id), JSON.stringify({ hashes: next }), {
        access: "private",
        token: token(),
        contentType: "application/json",
        addRandomSuffix: false,
        ...(previous.etag
          ? { allowOverwrite: true, ifMatch: previous.etag }
          : { allowOverwrite: false }),
      });
      return { count: next.length, liked: next.includes(hash) };
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError ||
          /pathname.already.exists|already exists|precondition.failed|conflict/i.test(String(error))) continue;
      throw error;
    }
  }
  throw new Error("Trop de modifications simultanées des réactions");
}
