/**
 * Vercel Blob uploads for portfolio edit mode.
 *
 * New files go to Blob (public URLs). Existing Cloudinary URLs in defaults /
 * localStorage keep working as plain image/video src strings — we never rewrite them.
 *
 * Large showreel / feature / demo videos should use unlisted YouTube links instead
 * of multi‑hundred‑MB Blob uploads.
 */

import { upload } from "@vercel/blob/client";

/** Folder namespace on the Blob store (pathname prefix). */
export const MEDIA_FOLDERS = {
  profile: "patrick-roziel/profile",
  projects: "patrick-roziel/projects",
  skills: "patrick-roziel/skills",
  media: "patrick-roziel/media",
  wallpaper: "patrick-roziel/wallpaper",
  showreel: "patrick-roziel/showreel",
  languages: "patrick-roziel/languages",
  documents: "patrick-roziel/documents",
} as const;

export type MediaFolder =
  (typeof MEDIA_FOLDERS)[keyof typeof MEDIA_FOLDERS];

/** @deprecated use MEDIA_FOLDERS — kept so existing imports compile */
export const CLOUDINARY_FOLDERS = MEDIA_FOLDERS;
/** @deprecated use MediaFolder */
export type CloudinaryFolder = MediaFolder;

export type MediaResourceType = "image" | "video" | "raw" | "auto";

export type MediaUploadResult = {
  /** Public HTTPS URL (Blob or legacy Cloudinary) */
  url: string;
  /** Alias of `url` for older call sites expecting Cloudinary shape */
  secure_url: string;
  pathname: string;
  contentType?: string | null;
};

export type MediaUploadOptions = {
  folder?: string;
  /** Hint only — Blob uses content-type of the file */
  resourceType?: MediaResourceType;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

const HANDLE_UPLOAD_URL = "/api/blob/upload";

function sanitizeFilename(name: string): string {
  const base = (name || "file").split(/[/\\]/).pop() || "file";
  return base.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 96);
}

function buildPathname(folder: string | undefined, file: File): string {
  const prefix = (folder || MEDIA_FOLDERS.media)
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.\./g, "");
  const safe =
    prefix.startsWith("patrick-roziel") || prefix === "patrick-roziel"
      ? prefix
      : `patrick-roziel/${prefix}`;
  return `${safe}/${Date.now()}-${sanitizeFilename(file.name)}`;
}

/**
 * Upload a File to Vercel Blob (public).
 * Uses client upload + server token route so the RW token never ships to the browser.
 */
export async function uploadToBlob(
  file: File,
  options: MediaUploadOptions = {}
): Promise<MediaUploadResult> {
  const { folder, onProgress, signal } = options;

  if (signal?.aborted) {
    throw new DOMException("Upload annulé", "AbortError");
  }

  if (!file || file.size <= 0) {
    throw new Error("Fichier vide.");
  }

  // Soft guard: Blob free tier / practical limit — prefer YouTube for huge videos
  const MAX = 100 * 1024 * 1024;
  if (file.size > MAX) {
    throw new Error(
      "Fichier trop lourd (max 100 Mo). Pour un showreel ou une longue démo, utilisez un lien YouTube non listé."
    );
  }

  const pathname = buildPathname(folder, file);
  const useMultipart = file.size > 4 * 1024 * 1024;

  try {
    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: HANDLE_UPLOAD_URL,
      multipart: useMultipart,
      abortSignal: signal,
      contentType: file.type || undefined,
      onUploadProgress: (event) => {
        if (typeof event.percentage === "number") {
          onProgress?.(Math.min(100, Math.max(0, Math.round(event.percentage))));
        }
      },
    });

    onProgress?.(100);

    return {
      url: blob.url,
      secure_url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    if (signal?.aborted) {
      throw new DOMException("Upload annulé", "AbortError");
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (/BLOB_READ_WRITE_TOKEN|token|unauthorized|401/i.test(msg)) {
      throw new Error(
        "Upload Blob non configuré. Ajoutez BLOB_READ_WRITE_TOKEN (Vercel → Storage → Blob → token) dans .env.local / le projet Vercel."
      );
    }
    throw new Error(msg || "Échec de l’upload vers Vercel Blob.");
  }
}

/**
 * @deprecated Prefer uploadToBlob — same behaviour, kept for older imports.
 */
export async function uploadToCloudinary(
  file: File,
  options: MediaUploadOptions = {}
): Promise<MediaUploadResult> {
  return uploadToBlob(file, options);
}

/** True if URL points at Vercel Blob public storage */
export function isVercelBlobUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return (
      host.endsWith(".public.blob.vercel-storage.com") ||
      host === "blob.vercel-storage.com"
    );
  } catch {
    return false;
  }
}

/** True if URL is a legacy Cloudinary delivery URL (still displayable) */
export function isCloudinaryUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname === "res.cloudinary.com";
  } catch {
    return /res\.cloudinary\.com/i.test(url);
  }
}
