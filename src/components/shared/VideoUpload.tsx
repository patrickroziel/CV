"use client";

import { useCallback, useRef, useState } from "react";
import { Film, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MEDIA_FOLDERS,
  uploadToBlob,
  type MediaFolder,
} from "@/lib/blob-upload";

/** Client-side guard — large showreels should use unlisted YouTube instead */
const MAX_BYTES = 100 * 1024 * 1024;

type VideoUploadProps = {
  value: string | null;
  /** Receives public Blob URL (or null when cleared) */
  onChange: (url: string | null) => void;
  className?: string;
  label?: string;
  folder?: MediaFolder | string;
  /**
   * `any` — common video formats (default).
   * `webm-mp4` — WebM / MP4 / MOV (alpha overlays, Hero glass).
   */
  formats?: "any" | "webm-mp4";
  /** Compact layout for nested editors */
  compact?: boolean;
};

export function VideoUpload({
  value,
  onChange,
  className,
  label = "Uploader une vidéo (MP4 / WebM)",
  folder = MEDIA_FOLDERS.media,
  formats = "any",
  compact = false,
}: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      const name = file.name || "";
      const looksLikeVideo =
        formats === "webm-mp4"
          ? file.type === "video/webm" ||
            file.type === "video/mp4" ||
            file.type === "video/quicktime" ||
            /\.(webm|mp4|mov)$/i.test(name)
          : file.type.startsWith("video/") ||
            /\.(mov|mp4|webm|ogg|m4v|avi|mkv)$/i.test(name);

      if (!looksLikeVideo) {
        setError(
          formats === "webm-mp4"
            ? "Fichier WebM (alpha), MP4 ou MOV requis."
            : "Fichier vidéo requis (MP4, MOV, WebM…)."
        );
        return;
      }
      if (file.size > MAX_BYTES) {
        setError(
          "Vidéo trop lourde (max 100 Mo). Préférez un lien YouTube pour les fichiers très longs."
        );
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setProgress(0);
      try {
        const result = await uploadToBlob(file, {
          folder,
          resourceType: "video",
          onProgress: setProgress,
          signal: controller.signal,
        });
        onChange(result.url);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "Impossible d’uploader la vidéo vers Vercel Blob."
        );
      } finally {
        setLoading(false);
        setProgress(0);
        abortRef.current = null;
      }
    },
    [onChange, folder, formats]
  );

  const accept =
    formats === "webm-mp4"
      ? "video/webm,video/mp4,video/quicktime,.webm,.mp4,.mov"
      : "video/mp4,video/webm,video/ogg,video/quicktime";

  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!loading) inputRef.current?.click();
          }
        }}
        onClick={() => {
          if (!loading) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void processFile(file);
        }}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center overflow-hidden border border-dashed transition-colors",
          compact
            ? "min-h-[88px] rounded-xl aspect-video max-h-28"
            : "rounded-2xl aspect-video",
          dragging
            ? "border-teal-300/60 bg-teal-300/10"
            : "border-white/20 bg-black/20 hover:border-white/35 hover:bg-white/5",
          value && "border-solid border-white/15",
          loading && "pointer-events-none"
        )}
      >
        {value && !loading ? (
          <video
            src={value}
            className="h-full w-full object-cover"
            muted
            playsInline
            loop
            autoPlay
          />
        ) : (
          <div
            className={cn(
              "flex flex-col items-center gap-1.5 text-center text-zinc-400",
              compact ? "p-2" : "gap-2 p-4"
            )}
          >
            {loading ? (
              <Loader2
                className={cn(
                  "animate-spin text-teal-300/80",
                  compact ? "h-6 w-6" : "h-8 w-8"
                )}
              />
            ) : (
              <Film
                className={cn(
                  "text-zinc-500",
                  compact ? "h-6 w-6" : "h-8 w-8"
                )}
              />
            )}
            <span className={cn(compact ? "text-[11px]" : "text-xs sm:text-sm")}>
              {loading ? `Upload… ${progress}%` : label}
            </span>
            {!loading && !compact && (
              <span className="text-[10px] text-zinc-600">
                Max 100 Mo · Vercel Blob (YouTube pour les longs showreels)
              </span>
            )}
          </div>
        )}

        {loading && (
          <div
            className="absolute inset-x-0 bottom-0 h-1.5 bg-black/40"
            aria-hidden
          >
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-amber-200 transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {value && !loading && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className={cn(
              "absolute right-2 top-2 shadow-md",
              compact ? "h-7 w-7" : "h-8 w-8"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            <X className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={loading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void processFile(file);
          e.target.value = "";
        }}
      />
      {error && (
        <p className="whitespace-pre-wrap break-words text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
