"use client";

import { useCallback, useRef, useState } from "react";
import { FileUp, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MEDIA_FOLDERS,
  uploadToBlob,
  type MediaFolder,
} from "@/lib/blob-upload";

const MAX_BYTES = 20 * 1024 * 1024;

export type DocumentKind = "pdf" | "html" | "any";

type DocumentUploadProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  label?: string;
  /** File kind for accept + validation */
  kind?: DocumentKind;
  folder?: MediaFolder | string;
};

function acceptFor(kind: DocumentKind): string {
  if (kind === "pdf") return "application/pdf,.pdf";
  if (kind === "html") return "text/html,.html,.htm";
  return "application/pdf,.pdf,text/html,.html,.htm";
}

function isAllowedFile(file: File, kind: DocumentKind): boolean {
  const name = file.name.toLowerCase();
  const isPdf =
    file.type === "application/pdf" || name.endsWith(".pdf");
  const isHtml =
    file.type === "text/html" ||
    name.endsWith(".html") ||
    name.endsWith(".htm");
  if (kind === "pdf") return isPdf;
  if (kind === "html") return isHtml;
  return isPdf || isHtml;
}

function kindError(kind: DocumentKind): string {
  if (kind === "pdf") return "Fichier PDF requis.";
  if (kind === "html") return "Fichier HTML requis (.html / .htm).";
  return "Fichier PDF ou HTML requis.";
}

/**
 * Upload PDF / HTML to Vercel Blob, or clear the stored URL.
 */
export function DocumentUpload({
  value,
  onChange,
  className,
  label = "Glissez un fichier ou cliquez",
  kind = "any",
  folder = MEDIA_FOLDERS.documents,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!isAllowedFile(file, kind)) {
        setError(kindError(kind));
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Fichier trop lourd (max 20 Mo).");
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
          resourceType: "raw",
          onProgress: setProgress,
          signal: controller.signal,
        });
        onChange(result.url);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "Impossible d’uploader le document vers Vercel Blob."
        );
      } finally {
        setLoading(false);
        setProgress(0);
        abortRef.current = null;
      }
    },
    [onChange, folder, kind]
  );

  const fileNameFromUrl = (url: string) => {
    try {
      const path = new URL(url).pathname;
      const last = path.split("/").pop() || "document";
      return decodeURIComponent(last);
    } catch {
      return "document";
    }
  };

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
          "relative flex min-h-[72px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-3 transition-colors",
          dragging
            ? "border-teal-300/60 bg-teal-300/10"
            : "border-white/20 bg-black/20 hover:border-white/35 hover:bg-white/5",
          value && "border-solid border-white/15",
          loading && "pointer-events-none"
        )}
      >
        {value && !loading ? (
          <div className="flex w-full items-center gap-2 pr-8 text-left">
            <FileUp className="h-5 w-5 shrink-0 text-teal-300" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-200">
                {fileNameFromUrl(value)}
              </p>
              <p className="truncate text-[10px] text-zinc-500">{value}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-center text-zinc-400">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-teal-300/80" />
            ) : (
              <FileUp className="h-6 w-6 text-zinc-500" />
            )}
            <span className="text-xs">
              {loading ? `Upload… ${progress}%` : label}
            </span>
          </div>
        )}

        {loading && (
          <div
            className="absolute inset-x-0 bottom-0 h-1 bg-black/40"
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
            className="absolute right-2 top-2 h-7 w-7 shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={acceptFor(kind)}
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
