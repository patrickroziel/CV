"use client";

import { useCallback, useRef, useState } from "react";
import { Film, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CLOUDINARY_FOLDERS,
  uploadToCloudinary,
  type CloudinaryFolder,
} from "@/lib/cloudinary";

/** Client-side guard — Cloudinary free tier allows larger files */
const MAX_BYTES = 100 * 1024 * 1024;

type VideoUploadProps = {
  value: string | null;
  /** Receives Cloudinary secure_url (or null when cleared) */
  onChange: (url: string | null) => void;
  className?: string;
  label?: string;
  folder?: CloudinaryFolder | string;
};

export function VideoUpload({
  value,
  onChange,
  className,
  label = "Uploader une vidéo (MP4 / WebM)",
  folder = CLOUDINARY_FOLDERS.media,
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

      // .mov sometimes has empty MIME on macOS — accept by extension too
      const looksLikeVideo =
        file.type.startsWith("video/") ||
        /\.(mov|mp4|webm|ogg|m4v|avi|mkv)$/i.test(file.name);

      if (!looksLikeVideo) {
        setError("Fichier vidéo requis (MP4, MOV, WebM…).");
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
        // Always force video endpoint + same unsigned preset as images
        const result = await uploadToCloudinary(file, {
          folder,
          resourceType: "video",
          onProgress: setProgress,
          signal: controller.signal,
        });
        onChange(result.secure_url);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "Impossible d’uploader la vidéo vers Cloudinary."
        );
      } finally {
        setLoading(false);
        setProgress(0);
        abortRef.current = null;
      }
    },
    [onChange, folder]
  );

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
          "relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed aspect-video transition-colors",
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
          <div className="flex flex-col items-center gap-2 p-4 text-center text-zinc-400">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-teal-300/80" />
            ) : (
              <Film className="h-8 w-8 text-zinc-500" />
            )}
            <span className="text-xs sm:text-sm">
              {loading ? `Upload… ${progress}%` : label}
            </span>
            {!loading && (
              <span className="text-[10px] text-zinc-600">
                Max 100 Mo · Cloudinary (chunked)
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
            className="absolute right-2 top-2 h-8 w-8 shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg,video/quicktime"
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
