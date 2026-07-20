"use client";

import { useCallback, useRef, useState } from "react";
import { Film, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Keep uploads small — localStorage quota is limited */
const MAX_BYTES = 4 * 1024 * 1024;

type VideoUploadProps = {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  className?: string;
  label?: string;
};

export function VideoUpload({
  value,
  onChange,
  className,
  label = "Uploader une vidéo courte (MP4 / WebM)",
}: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.type.startsWith("video/")) {
        setError("Fichier vidéo requis (MP4, WebM…).");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError(
          "Vidéo trop lourde (max 4 Mo). Préférez un lien YouTube pour les fichiers longs."
        );
        return;
      }
      setLoading(true);
      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Lecture impossible"));
          reader.readAsDataURL(file);
        });
        onChange(dataUrl);
      } catch {
        setError("Impossible de lire la vidéo.");
      } finally {
        setLoading(false);
      }
    },
    [onChange]
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
          value && "border-solid border-white/15"
        )}
      >
        {value ? (
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
            <Film className="h-8 w-8 text-zinc-500" />
            <span className="text-xs sm:text-sm">
              {loading ? "Chargement…" : label}
            </span>
            <span className="text-[10px] text-zinc-600">Max 4 Mo</span>
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
        accept="video/mp4,video/webm,video/ogg,video/quicktime"
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
