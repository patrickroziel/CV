"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 1.5 * 1024 * 1024;
const MAX_WIDTH = 1200;

type ImageUploadProps = {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  className?: string;
  aspectClassName?: string;
  label?: string;
  round?: boolean;
  maxWidth?: number;
  quality?: number;
};

async function resizeImage(
  file: File,
  maxWidth: number,
  quality: number
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non supporté");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

export function ImageUpload({
  value,
  onChange,
  className,
  aspectClassName = "aspect-video",
  label = "Glissez une image ou cliquez",
  round = false,
  maxWidth = MAX_WIDTH,
  quality = 0.85,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("Fichier image requis (JPG, PNG, WebP…).");
        return;
      }
      if (file.size > MAX_BYTES * 3) {
        setError("Image trop lourde (max ~4 Mo avant compression).");
        return;
      }
      setLoading(true);
      try {
        const dataUrl = await resizeImage(file, maxWidth, quality);
        onChange(dataUrl);
      } catch {
        setError("Impossible de traiter l’image.");
      } finally {
        setLoading(false);
      }
    },
    [onChange, maxWidth, quality]
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
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
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
          value && "border-solid border-white/15"
        )}
      >
        {value ? (
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
            <ImagePlus className="h-8 w-8 text-zinc-500" />
            <span className="text-xs sm:text-sm">
              {loading ? "Traitement…" : label}
            </span>
          </div>
        )}
        {value && (
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
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void processFile(file);
          e.target.value = "";
        }}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
