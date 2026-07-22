/**
 * Cloudinary client upload — unsigned only.
 *
 * Always sends upload_preset="portfolio_upload" on every request
 * (including every chunk of a large video).
 *
 * Large videos use Cloudinary chunked upload so multipart fields
 * (preset) are not lost mid-body on big .mov/.mp4 files.
 */

/** Exact unsigned preset name (must match Cloudinary dashboard). */
export const CLOUDINARY_DEFAULT_UPLOAD_PRESET = "portfolio_upload" as const;

export const CLOUDINARY_CLOUD_NAME =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim()) ||
  "ptp8diwd";

/**
 * Always returns a non-empty preset. Hardcoded default wins over empty env.
 */
export function getCloudinaryUploadPreset(): string {
  const fromEnv = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    ?.trim()
    .replace(/^["']|["']$/g, "")
    .trim();
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  return CLOUDINARY_DEFAULT_UPLOAD_PRESET;
}

export const CLOUDINARY_UPLOAD_PRESET = CLOUDINARY_DEFAULT_UPLOAD_PRESET;

export const CLOUDINARY_FOLDERS = {
  profile: "patrick-roziel/profile",
  projects: "patrick-roziel/projects",
  skills: "patrick-roziel/skills",
  media: "patrick-roziel/media",
  wallpaper: "patrick-roziel/wallpaper",
  showreel: "patrick-roziel/showreel",
  languages: "patrick-roziel/languages",
} as const;

export type CloudinaryFolder =
  (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];

export type CloudinaryResourceType = "image" | "video" | "raw" | "auto";

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  duration?: number;
};

export type CloudinaryUploadOptions = {
  folder?: string;
  resourceType?: CloudinaryResourceType;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

/** Cloudinary requires chunks >= 5MB except the last one */
const CHUNK_SIZE = 6 * 1024 * 1024;
/** Use chunked upload above this size (videos / large files) */
const CHUNK_THRESHOLD = 5 * 1024 * 1024;

function resolvePreset(): string {
  return getCloudinaryUploadPreset() || CLOUDINARY_DEFAULT_UPLOAD_PRESET;
}

function uploadUrl(
  cloudName: string,
  resourceType: CloudinaryResourceType
): string {
  return `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
}

function describeFormData(formData: FormData): string {
  const parts: string[] = [];
  formData.forEach((value, key) => {
    if (value instanceof Blob) {
      parts.push(
        `${key}=<${value instanceof File ? value.name || "File" : "Blob"} ${value.type || "unknown"} ${value.size}B>`
      );
    } else {
      parts.push(`${key}="${String(value)}"`);
    }
  });
  return parts.length ? parts.join(", ") : "(vide)";
}

/**
 * Fresh FormData for every request (single or chunk).
 * upload_preset is ALWAYS the first field.
 */
function buildUnsignedFormData(
  blob: Blob,
  preset: string,
  filename: string
): FormData {
  const formData = new FormData();
  formData.append("upload_preset", preset);
  // Explicit filename helps .mov / quicktime detection on Cloudinary
  formData.append("file", blob, filename);
  return formData;
}

function assertPresetPresent(formData: FormData): string {
  if (!formData.has("upload_preset")) {
    throw new Error(
      `BUG: upload_preset absent du FormData. Attendu: "${CLOUDINARY_DEFAULT_UPLOAD_PRESET}".`
    );
  }
  const value = String(formData.get("upload_preset") ?? "").trim();
  if (!value) {
    throw new Error(
      `BUG: upload_preset vide. Attendu: "${CLOUDINARY_DEFAULT_UPLOAD_PRESET}".`
    );
  }
  return value;
}

function uniqueUploadId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type XhrContext = {
  kind: "image" | "video" | "auto" | "raw";
  endpoint: string;
  preset: string;
  cloudName: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  chunked: boolean;
  chunkLabel?: string;
};

function formatUploadError(
  cloudMessage: string,
  ctx: XhrContext,
  formData: FormData
): string {
  const sentPreset = formData.get("upload_preset");
  return (
    `Cloudinary: ${cloudMessage}\n` +
    `Type: ${ctx.kind}${ctx.chunked ? " (chunked)" : " (single)"}\n` +
    `Endpoint: ${ctx.endpoint}\n` +
    (ctx.chunkLabel ? `Chunk: ${ctx.chunkLabel}\n` : "") +
    `Fichier: ${ctx.fileName} (${ctx.fileSize} B, type="${ctx.fileType || "unknown"}")\n` +
    `Mode: unsigned\n` +
    `FormData: ${describeFormData(formData)}\n` +
    `upload_preset has(): ${formData.has("upload_preset")}, value: ${
      sentPreset == null ? "(null)" : `"${String(sentPreset)}"`
    }\n` +
    `Preset app: "${ctx.preset}" (défaut: "${CLOUDINARY_DEFAULT_UPLOAD_PRESET}")\n` +
    `Cloud: "${ctx.cloudName}"\n` +
    `Note: image et vidéo utilisent le même preset "portfolio_upload". ` +
    `Vidéo → /video/upload ; image → /image/upload.`
  );
}

function xhrPost(options: {
  endpoint: string;
  formData: FormData;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  onProgress?: (loaded: number, total: number) => void;
  ctx: XhrContext;
}): Promise<CloudinaryUploadResult> {
  const { endpoint, formData, headers, signal, onProgress, ctx } = options;

  assertPresetPresent(formData);

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Upload annulé", "AbortError"));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    // Never set Content-Type manually — boundary must be set by the browser

    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        xhr.setRequestHeader(k, v);
      }
    }

    const onAbort = () => xhr.abort();
    signal?.addEventListener("abort", onAbort);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(event.loaded, event.total);
    };

    xhr.onload = () => {
      signal?.removeEventListener("abort", onAbort);

      // Chunked intermediate responses are 200 with partial info;
      // final response includes secure_url.
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as CloudinaryUploadResult & {
            done?: boolean;
          };
          resolve(data);
        } catch {
          reject(new Error("Réponse Cloudinary illisible."));
        }
        return;
      }

      let cloudMessage = `HTTP ${xhr.status}`;
      try {
        const err = JSON.parse(xhr.responseText) as {
          error?: { message?: string };
        };
        if (err.error?.message) cloudMessage = err.error.message;
      } catch {
        if (xhr.responseText) cloudMessage = xhr.responseText.slice(0, 200);
      }

      reject(new Error(formatUploadError(cloudMessage, ctx, formData)));
    };

    xhr.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(
        new Error(
          formatUploadError("Erreur réseau", ctx, formData)
        )
      );
    };

    xhr.onabort = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Upload annulé", "AbortError"));
    };

    xhr.send(formData);
  });
}

function isVideoResource(resourceType: CloudinaryResourceType): boolean {
  return resourceType === "video";
}

/**
 * Single-shot unsigned upload (images + small videos).
 */
async function uploadSingle(
  file: File,
  resourceType: CloudinaryResourceType,
  preset: string,
  cloudName: string,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<CloudinaryUploadResult> {
  const endpoint = uploadUrl(cloudName, resourceType);
  const formData = buildUnsignedFormData(file, preset, file.name || "upload");

  const kind = isVideoResource(resourceType)
    ? "video"
    : resourceType === "image"
      ? "image"
      : "auto";

  const result = await xhrPost({
    endpoint,
    formData,
    signal,
    onProgress: (loaded, total) => {
      onProgress?.(Math.min(100, Math.max(0, Math.round((loaded / total) * 100))));
    },
    ctx: {
      kind,
      endpoint,
      preset,
      cloudName,
      fileName: file.name || "upload",
      fileSize: file.size,
      fileType: file.type,
      chunked: false,
    },
  });

  if (!result.secure_url) {
    throw new Error(
      formatUploadError(
        "Réponse sans secure_url (upload single)",
        {
          kind,
          endpoint,
          preset,
          cloudName,
          fileName: file.name || "upload",
          fileSize: file.size,
          fileType: file.type,
          chunked: false,
        },
        formData
      )
    );
  }

  onProgress?.(100);
  return result;
}

/**
 * Cloudinary chunked upload — required reliability for large videos (.mov 40Mo+).
 * Each chunk rebuilds FormData with the same upload_preset.
 * @see https://cloudinary.com/documentation/upload_images#chunked_asset_upload
 */
async function uploadChunked(
  file: File,
  resourceType: CloudinaryResourceType,
  preset: string,
  cloudName: string,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<CloudinaryUploadResult> {
  // Videos must hit /video/upload (same preset as images on /image/upload)
  const endpoint = uploadUrl(cloudName, resourceType);
  const uploadId = uniqueUploadId();
  const total = file.size;
  const fileName = file.name || (isVideoResource(resourceType) ? "video.mov" : "upload.bin");
  let offset = 0;
  let lastResult: CloudinaryUploadResult | null = null;

  while (offset < total) {
    if (signal?.aborted) {
      throw new DOMException("Upload annulé", "AbortError");
    }

    const end = Math.min(offset + CHUNK_SIZE, total);
    const chunk = file.slice(offset, end);
    const formData = buildUnsignedFormData(chunk, preset, fileName);
    assertPresetPresent(formData);

    // Content-Range is inclusive on both ends: bytes start-(end-1)/total
    const contentRange = `bytes ${offset}-${end - 1}/${total}`;

    const result = await xhrPost({
      endpoint,
      formData,
      headers: {
        "X-Unique-Upload-Id": uploadId,
        "Content-Range": contentRange,
      },
      signal,
      onProgress: (loaded, chunkTotal) => {
        // Overall progress across chunks
        const overall = offset + (chunkTotal ? (loaded / chunkTotal) * (end - offset) : 0);
        onProgress?.(
          Math.min(99, Math.max(0, Math.round((overall / total) * 100)))
        );
      },
      ctx: {
        kind: isVideoResource(resourceType) ? "video" : "auto",
        endpoint,
        preset,
        cloudName,
        fileName,
        fileSize: total,
        fileType: file.type,
        chunked: true,
        chunkLabel: `${offset}-${end - 1}/${total}`,
      },
    });

    lastResult = result;
    offset = end;
  }

  if (!lastResult?.secure_url) {
    throw new Error(
      `Upload vidéo chunked terminé sans secure_url.\n` +
        `Endpoint: ${endpoint}\n` +
        `Preset: "${preset}"\n` +
        `Fichier: ${fileName} (${total} B)\n` +
        `Upload-Id: ${uploadId}`
    );
  }

  onProgress?.(100);
  return lastResult;
}

/**
 * Upload a File to Cloudinary (unsigned).
 * - Images: single request → /image/upload
 * - Videos (and large files): chunked → /video/upload
 * - Same preset "portfolio_upload" in every FormData
 */
export async function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const {
    resourceType: requestedType = "image",
    onProgress,
    signal,
  } = options;

  const cloudName = CLOUDINARY_CLOUD_NAME;
  const preset = resolvePreset();

  if (!cloudName) {
    throw new Error(
      "Cloud name Cloudinary manquant. Définissez NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=ptp8diwd."
    );
  }
  if (!preset) {
    throw new Error(
      'Preset Cloudinary manquant. Attendu: upload_preset="portfolio_upload".'
    );
  }

  if (signal?.aborted) {
    throw new DOMException("Upload annulé", "AbortError");
  }

  // Normalize resource type: videos always use the video endpoint
  const isVideo =
    requestedType === "video" ||
    file.type.startsWith("video/") ||
    /\.(mov|mp4|webm|ogg|m4v|avi|mkv)$/i.test(file.name || "");

  const resourceType: CloudinaryResourceType = isVideo
    ? "video"
    : requestedType === "raw"
      ? "raw"
      : requestedType === "auto"
        ? "auto"
        : "image";

  const useChunked =
    isVideo || file.size >= CHUNK_THRESHOLD || resourceType === "video";

  if (useChunked) {
    return uploadChunked(
      file,
      resourceType === "image" ? "auto" : resourceType,
      preset,
      cloudName,
      onProgress,
      signal
    );
  }

  return uploadSingle(
    file,
    resourceType,
    preset,
    cloudName,
    onProgress,
    signal
  );
}

export function isCloudinaryUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    url.includes("res.cloudinary.com/") || url.includes("cloudinary.com/")
  );
}

export function cloudinaryOptimizedUrl(
  url: string,
  opts?: { width?: number; quality?: string | number; format?: string }
): string {
  if (!url.includes("/upload/")) return url;
  const parts: string[] = [];
  if (opts?.width) parts.push(`w_${opts.width}`);
  parts.push(`q_${opts?.quality ?? "auto"}`);
  parts.push(`f_${opts?.format ?? "auto"}`);
  return url.replace("/upload/", `/upload/${parts.join(",")}/`);
}
