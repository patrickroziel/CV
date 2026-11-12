import { createHash, randomBytes } from "node:crypto";
import { listPublicPosts } from "@/lib/server/notes-sharing";
import { blobReady, enqueue, readJsonBlob, writeJsonBlob } from "@/lib/server/json-blob";

export const likeCookie = "pr_post_reaction";
const VALID_ID = /^[a-zA-Z0-9_-]{1,120}$/;
const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const MAX_BATCH = 60;
const STORE = "reactions";

type StoredLike = { postId: string; hash: string };
type CommentStatus = "pending" | "approved" | "rejected";
export type StoredComment = {
  id: string;
  postId: string;
  name: string;
  body: string;
  status: CommentStatus;
  createdAt: string;
};
type ReactionsFile = {
  revision: number;
  likes: StoredLike[];
  comments: StoredComment[];
  recent: { key: string; at: number }[];
};

const emptyFile = (): ReactionsFile => ({ revision: 0, likes: [], comments: [], recent: [] });

async function readFile() {
  return (await readJsonBlob<ReactionsFile>(STORE)) ?? emptyFile();
}

async function updateFile(change: (current: ReactionsFile) => ReactionsFile | null) {
  return enqueue(STORE, async () => {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const current = await readFile();
      const next = change(current);
      if (!next) return current;
      const again = await readFile();
      if (again.revision !== current.revision) continue;
      next.revision = current.revision + 1;
      if (next.likes.length > 8000) next.likes = next.likes.slice(-8000);
      if (next.comments.length > 2000) {
        const pending = next.comments.filter((comment) => comment.status === "pending");
        const rest = next.comments.filter((comment) => comment.status !== "pending").slice(-1500);
        next.comments = [...rest, ...pending].slice(-2000);
      }
      next.recent = next.recent.filter((entry) => entry.at > Date.now() - 24 * 60 * 60 * 1000).slice(-400);
      await writeJsonBlob(STORE, next);
      return next;
    }
    throw new Error("Trop de messages en même temps.");
  });
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
    const posts = await listPublicPosts();
    return new Set(posts.map((post) => post.id).filter((id) => VALID_ID.test(id)));
  } catch {
    return null;
  }
}

export async function isPublishedPost(id: string) {
  if (!VALID_ID.test(id)) return false;
  const known = await publishedIdSet();
  return known ? known.has(id) : false;
}

export function tokenLooksValid(token: string | undefined) {
  return typeof token === "string" && TOKEN_PATTERN.test(token);
}

/** Token created randomly by the server. Hash varies per post and cannot be used to track a visitor across posts. */
export function visitorHash(postId: string, token: string) {
  return createHash("sha256").update("portfolio-like-v1:").update(postId).update(":").update(token).digest("hex");
}

export type LikeState = { count: number; liked: boolean };

export async function readLikes(id: string, hash: string | null): Promise<LikeState> {
  const states = await readLikeStates([id], hash ? { [id]: hash } : {});
  return states[id] ?? { count: 0, liked: false };
}

export async function readLikeStates(ids: string[], hashes: Record<string, string>): Promise<Record<string, LikeState>> {
  const unique = cleanPostIds(ids);
  const result: Record<string, LikeState> = {};
  for (const id of unique) result[id] = { count: 0, liked: false };
  if (!unique.length || !blobReady()) return result;
  const file = await readFile();
  const wanted = new Set(unique);
  for (const like of file.likes) {
    if (!wanted.has(like.postId) || !result[like.postId]) continue;
    result[like.postId].count += 1;
    if (hashes[like.postId] && like.hash === hashes[like.postId]) result[like.postId].liked = true;
  }
  return result;
}

export async function updateLike(id: string, hash: string, liked: boolean) {
  if (!blobReady()) throw new Error("Stockage indisponible");
  const file = await updateFile((current) => {
    const likes = current.likes.filter((like) => like.postId !== id || like.hash !== hash);
    if (liked) likes.push({ postId: id, hash });
    return { ...current, likes };
  });
  const count = file.likes.filter((like) => like.postId === id).length;
  return { count, liked: file.likes.some((like) => like.postId === id && like.hash === hash) };
}

export function plainText(value: string, max: number) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function publicComments(postId: string) {
  if (!blobReady()) return [];
  const file = await readFile();
  return file.comments
    .filter((comment) => comment.postId === postId && comment.status === "approved")
    .slice(-80)
    .map(({ id, name, body, createdAt }) => ({ id, name, body, createdAt }));
}

export async function addComment(postId: string, name: string, body: string, visitor: string) {
  if (!blobReady()) throw new Error("Stockage indisponible");
  const cleanName = plainText(name, 40);
  const cleanBody = plainText(body, 800);
  if (cleanName.length < 2) throw new Error("Indique un prénom ou un pseudo.");
  if (cleanBody.length < 2) throw new Error("Le message est trop court.");
  const hourAgo = Date.now() - 60 * 60 * 1000;
  await updateFile((current) => {
    const recent = current.recent.filter((entry) => entry.key === visitor && entry.at > hourAgo);
    if (recent.length >= 5) throw new Error("Trop de messages pour le moment. Réessaie un peu plus tard.");
    const comment: StoredComment = {
      id: randomBytes(8).toString("hex"),
      postId,
      name: cleanName,
      body: cleanBody,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    return {
      ...current,
      comments: [...current.comments, comment],
      recent: [...current.recent, { key: visitor, at: Date.now() }],
    };
  });
}

export async function listModerationComments() {
  const file = await readFile();
  const posts = await listPublicPosts().catch(() => []);
  const titles = new Map(posts.map((post) => [post.id, post.title]));
  return file.comments
    .filter((comment) => comment.status !== "rejected")
    .slice()
    .reverse()
    .map((comment) => ({
      ...comment,
      postTitle: titleText(titles.get(comment.postId)),
    }));
}

function titleText(title: unknown) {
  if (typeof title === "string") return title;
  if (title && typeof title === "object" && "fr" in title && typeof title.fr === "string") return title.fr;
  return "Publication";
}

export async function moderateComment(id: string, action: "approve" | "reject" | "delete") {
  if (!/^[a-f0-9]{16}$/.test(id)) throw new Error("Commentaire introuvable.");
  await updateFile((current) => {
    const exists = current.comments.some((comment) => comment.id === id);
    if (!exists) throw new Error("Commentaire introuvable.");
    const comments = action === "delete"
      ? current.comments.filter((comment) => comment.id !== id)
      : current.comments.map((comment) => comment.id === id
        ? { ...comment, status: action === "approve" ? "approved" as const : "rejected" as const }
        : comment);
    return { ...current, comments };
  });
}
