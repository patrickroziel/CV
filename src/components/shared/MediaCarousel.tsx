"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaItem } from "@/lib/types";
import { getL } from "@/lib/i18n-content";
import { cn, youtubeEmbedUrl, xEmbedUrl, isFileVideoUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type MediaCarouselProps = {
  items: MediaItem[];
  className?: string;
  /** Compact height for timeline cards */
  compact?: boolean;
};

function Slide({ item }: { item: MediaItem }) {
  const caption = getL(item.caption);
  if (item.type === "image" || (!item.type && item.url.startsWith("data:image"))) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt={caption || "Média"}
        className="h-full w-full object-cover"
      />
    );
  }

  if (item.type === "youtube") {
    const src = youtubeEmbedUrl(item.url, {
      autoplay: false,
      mute: false,
      controls: true,
    });
    if (!src) return null;
    return (
      <iframe
        src={src}
        title={caption || "YouTube"}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    );
  }

  if (item.type === "x") {
    const src = xEmbedUrl(item.url);
    if (!src) return null;
    return (
      <iframe
        src={src}
        title={caption || "X"}
        className="absolute inset-0 h-full w-full border-0"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // file video
  if (item.type === "file" || isFileVideoUrl(item.url)) {
    return (
      <video
        src={item.url}
        className="h-full w-full object-cover"
        controls
        playsInline
        preload="metadata"
      />
    );
  }

  // fallback image
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.url} alt="" className="h-full w-full object-cover" />
  );
}

export function MediaCarousel({
  items,
  className,
  compact = false,
}: MediaCarouselProps) {
  const [index, setIndex] = useState(0);
  if (!items?.length) return null;

  const safeIndex = Math.min(index, items.length - 1);
  const item = items[safeIndex];
  const multi = items.length > 1;

  const prev = () =>
    setIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setIndex((i) => (i + 1) % items.length);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-black/40",
        className
      )}
    >
      <div
        className={cn(
          "relative w-full",
          compact ? "aspect-[16/10] max-h-48" : "aspect-video"
        )}
      >
        <Slide key={item.id} item={item} />
      </div>

      {getL(item.caption) && (
        <p className="border-t border-white/10 bg-black/30 px-3 py-1.5 text-xs text-zinc-400">
          {getL(item.caption)}
        </p>
      )}

      {multi && (
        <>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border-white/20 bg-black/50 backdrop-blur-md"
            onClick={prev}
            aria-label="Précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border-white/20 bg-black/50 backdrop-blur-md"
            onClick={next}
            aria-label="Suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {items.map((m, i) => (
              <button
                key={m.id}
                type="button"
                aria-label={`Média ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === safeIndex
                    ? "w-4 bg-teal-300"
                    : "w-1.5 bg-white/40 hover:bg-white/60"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
