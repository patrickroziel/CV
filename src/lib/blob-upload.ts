/**
 * Media uploads for portfolio edit mode.
 * New files go to Cloudflare R2 only. Vercel Blob is no longer used.
 */

/** Folder namespace on the store (pathname prefix). */
export const MEDIA_FOLDERS = {
  profile: "patrick-roziel/profile",
  projects: "patrick-roziel/projects",
  skills: "patrick-roziel/skills",
  media: "patrick-roziel/media",
  wallpaper: "patrick-roziel/wallpaper",
  showreel: "patrick-roziel/showreel",
  languages: "patrick-roziel/languages",
  documents: "patrick-roziel/documents",
  social: "patrick-roziel/social",
} as const;

export type MediaFolder =
  (typeof MEDIA_FOLDERS)[keyof typeof MEDIA_FOLDERS];

/** @deprecated use MEDIA_FOLDERS — kept so existing imports compile */
export const CLOUDINARY_FOLDERS = MEDIA_FOLDERS;
/** @deprecated use MediaFolder */
export type CloudinaryFolder = MediaFolder;

export type MediaResourceType = "image" | "video" | "raw" | "auto";

export type MediaUploadResult = {
  /** Public HTTPS URL (R2, Blob or legacy Cloudinary) */
  url: string;
  /** Alias of `url` for older call sites expecting Cloudinary shape */
  secure_url: string;
  pathname: string;
  contentType?: string | null;
};

export type MediaUploadOptions = {
  folder?: string;
  /** Hint only */
  resourceType?: MediaResourceType;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

const R2_PRESIGN_URL = "/api/r2/upload";

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

async function uploadToR2(
  file: File,
  options: MediaUploadOptions = {}
): Promise<MediaUploadResult> {
  const { folder, onProgress, signal } = options;

  if (signal?.aborted) throw new DOMException("Upload annulé", "AbortError");
  if (!file || file.size <= 0) throw new Error("Fichier vide.");

  const MAX = 100 * 1024 * 1024;
  if (file.size > MAX) {
    throw new Error(
      "Fichier trop lourd (max 100 Mo). Pour un showreel ou une longue démo, utilisez un lien YouTube non listé."
    );
  }

  const pathname = buildPathname(folder, file);

  const presignRes = await fetch(R2_PRESIGN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pathname,
      contentType: file.type || "application/octet-stream",
      size: file.size,
    }),
    signal,
  });

  if (!presignRes.ok) {
    const data = (await presignRes.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `R2 presign failed (${presignRes.status})`);
  }

  const { uploadUrl, publicUrl } = (await presignRes.json()) as {
    uploadUrl: string;
    publicUrl: string;
    pathname: string;
  };

  onProgress?.(10);

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    signal,
  });

  if (!putRes.ok) {
    throw new Error(`Envoi Cloudflare refusé (${putRes.status}).`);
  }

  onProgress?.(100);

  return {
    url: publicUrl,
    secure_url: publicUrl,
    pathname,
    contentType: file.type || null,
  };
}

/** Upload a file to Cloudflare R2. Vercel Blob is not used. */
export async function uploadToBlob(
  file: File,
  options: MediaUploadOptions = {}
): Promise<MediaUploadResult> {
  try {
    return await uploadToR2(file, options);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/Variables R2|R2_BUCKET|R2_PUBLIC|CLOUDFLARE_ACCOUNT/i.test(msg)) {
      throw new Error("Cloudflare n’est pas configuré. Vérifiez les variables R2 dans Vercel.");
    }
    throw err instanceof Error ? err : new Error(msg);
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

/** True if URL points at the Cloudflare R2 public domain */
export function isR2Url(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return host === "media.patrickroziel.com" || host.endsWith(".r2.dev");
  } catch {
    return false;
  }
}
