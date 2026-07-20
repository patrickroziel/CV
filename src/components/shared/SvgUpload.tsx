"use client";

import { useCallback, useRef, useState } from "react";
import { FileCode2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 500 * 1024;

type SvgUploadProps = {
  value: string | null;
  onChange: (svg: string | null) => void;
  className?: string;
  label?: string;
};

/** Upload a custom SVG (stored as text / data URL for outline animation). */
export function SvgUpload({
  value,
  onChange,
  className,
  label = "Uploader un SVG de contour",
}: SvgUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const process = useCallback(
    async (file: File) => {
      setError(null);
      const isSvg =
        file.type === "image/svg+xml" ||
        file.name.toLowerCase().endsWith(".svg");
      if (!isSvg) {
        setError("Fichier SVG requis.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("SVG trop lourd (max 500 Ko).");
        return;
      }
      try {
        const text = await file.text();
        if (!text.includes("<svg") && !text.includes("<path")) {
          setError("SVG invalide (pas de balise svg/path).");
          return;
        }
        // Prefer raw SVG text for path extraction; also keep as data URL for preview
        const dataUrl = `data:image/svg+xml;base64,${btoa(
          unescape(encodeURIComponent(text))
        )}`;
        onChange(dataUrl);
      } catch {
        setError("Impossible de lire le SVG.");
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
        className={cn(
          "relative flex min-h-[72px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/20 bg-black/20 p-3 transition hover:border-white/35",
          value && "border-solid border-white/15"
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Aperçu SVG"
            className="max-h-16 max-w-full object-contain invert opacity-80"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-center text-zinc-400">
            <FileCode2 className="h-6 w-6 text-zinc-500" />
            <span className="text-xs">{label}</span>
          </div>
        )}
        {value && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-2 top-2 h-7 w-7"
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
        accept=".svg,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void process(file);
          e.target.value = "";
        }}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
