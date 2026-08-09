"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MEDIA_FOLDERS,
  uploadToBlob,
  type MediaFolder,
} from "@/lib/blob-upload";

/** Client-side guard before upload */
const MAX_BYTES = 12 * 1024 * 1024;

type ImageUploadProps = {
  value: string | null;
  /** Receives public Blob URL (or null when cleared) */
  onChange: (url: string | null) => void;
  className?: string;
  aspectClassName?: string;
  label?: string;
  round?: boolean;
  /** Blob pathname prefix */
  folder?: MediaFolder | string;
};

export function ImageUpload({
  value,
  onChange,
  className,
  aspectClassName = "aspect-video",
  label = "Glissez une image ou cliquez",
  round = false,
  folder = MEDIA_FOLDERS.media,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("Fichier image requis (JPG, PNG, WebP…).");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Image trop lourde (max 12 Mo).");
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
          resourceType: "image",
          onProgress: setProgress,
          signal: controller.signal,
        });
        onChange(result.url);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "Impossible d’uploader l’image vers Vercel Blob."
        );
      } finally {
        setLoading(false);
        setProgress(0);
        abortRef.current = null;
      }
    },
    [onChange, folder]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void processFile(file);
    },
    [processFile]
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
        onDrop={onDrop}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center overflow-hidden border border-dashed transition-colors",
          round ? "rounded-full" : "rounded-2xl",
          aspectClassName,
          dragging
            ? "border-teal-300/60 bg-teal-300/10"
            : "border-white/20 bg-black/20 hover:border-white/35 hover:bg-white/5",
          value && "border-solid border-white/15",
          loading && "pointer-events-none"
        )}
      >
        {value && !loading ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Aperçu"
            className={cn(
              "h-full w-full object-cover",
              round ? "rounded-full" : ""
            )}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center text-zinc-400">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-teal-300/80" />
            ) : (
              <ImagePlus className="h-8 w-8 text-zinc-500" />
            )}
            <span className="text-xs sm:text-sm">
              {loading ? `Upload… ${progress}%` : label}
            </span>
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
        accept="image/*"
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
