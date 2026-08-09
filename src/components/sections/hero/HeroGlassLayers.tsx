"use client";

import { useEffect, useMemo, useState } from "react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import {
  VideoFallbackSurface,
  VideoWithFallback,
} from "@/components/shared/VideoWithFallback";
import { DEFAULT_HERO_GLASS, type HeroGlassBackMedia } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Hero glass media layers (editable in Apparence).
 *
 * CRITICAL sizing rules:
 * - Layers are always position:absolute; inset:0 — out of document flow
 * - They NEVER set Hero height/width (no aspect-ratio, no min-height from media)
 * - Hero size is content-driven only; media fills via object-cover
 */

type LayerProps = {
  className?: string;
};

function pickBackMedia(
  items: HeroGlassBackMedia[] | undefined
): HeroGlassBackMedia | null {
  const pool = (items ?? []).filter((v) => v.enabled && v.url?.trim());
  if (pool.length === 0) return null;
  if (pool.length === 1) return pool[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Shared fill media — always covers the layer box, never expands it */
function HeroFillMedia({
  url,
  type,
  fallbackImageUrl,
  preserveAlpha,
  opacity = 1,
}: {
  url: string;
  type: "image" | "video";
  fallbackImageUrl?: string | null;
  preserveAlpha?: boolean;
  opacity?: number;
}) {
  const op = Math.min(1, Math.max(0, opacity));
  if (type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={url}
        src={url}
        alt=""
        className="hero-glass-media absolute inset-0 block h-full w-full max-h-none max-w-none object-cover object-center transition-opacity duration-700 ease-out"
        style={{ opacity: op }}
        draggable={false}
      />
    );
  }

  return (
    <div
      className="hero-glass-media absolute inset-0 h-full w-full transition-opacity duration-700 ease-out"
      style={{ opacity: op }}
    >
      <VideoWithFallback
        key={url}
        src={url}
        fallbackImageUrl={fallbackImageUrl}
        fill
        preserveAlpha={preserveAlpha}
        className="h-full w-full max-h-none max-w-none"
        videoClassName="absolute inset-0 h-full w-full max-h-none max-w-none object-cover object-center bg-transparent"
        objectFit="cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
    </div>
  );
}

/** Layer 1 — behind GlassCard so backdrop-filter glazes it */
export function HeroGlassBackLayer({ className }: LayerProps) {
  const { data, isHydrated } = usePortfolio();
  const config = data.heroGlass ?? DEFAULT_HERO_GLASS;
  const poolKey = useMemo(
    () =>
      (config.backVideos ?? [])
        .map(
          (v) =>
            `${v.id}:${v.enabled ? 1 : 0}:${v.type}:${v.url}:${v.fallbackImageUrl ?? ""}`
        )
        .join("|"),
    [config.backVideos]
  );

  const [media, setMedia] = useState<HeroGlassBackMedia | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    setMedia(pickBackMedia(config.backVideos));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, poolKey]);

  if (!media?.url) return null;

  const url = media.url.trim();
  const isImage = media.type === "image";

  return (
    <div
      className={cn(
        "hero-glass-back pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[1.5rem]",
        className
      )}
      aria-hidden
    >
      <HeroFillMedia
        url={url}
        type={isImage ? "image" : "video"}
        fallbackImageUrl={media.fallbackImageUrl}
        preserveAlpha
        opacity={
          typeof media.opacity === "number" ? media.opacity : 1
        }
      />
    </div>
  );
}

/** Layer 2 — inside the card, above glass energy, below text/photo (z-[5]) */
export function HeroGlassFrontLayer({ className }: LayerProps) {
  const { data } = usePortfolio();
  const front = (data.heroGlass ?? DEFAULT_HERO_GLASS).front;
  const opacity =
    typeof front.opacity === "number"
      ? Math.min(1, Math.max(0, front.opacity))
      : 0.55;

  if (front.type === "none" || !front.url?.trim()) return null;

  const isAlphaVideo = front.type === "video";

  return (
    <div
      className={cn(
        "hero-glass-front pointer-events-none absolute inset-0 z-[5] overflow-hidden rounded-[inherit] bg-transparent transition-opacity duration-700 ease-out",
        isAlphaVideo ? "hero-glass-front--alpha" : "hero-glass-front--texture",
        className
      )}
      style={{ opacity }}
      aria-hidden
    >
      <HeroFillMedia
        url={front.url.trim()}
        type={front.type === "image" ? "image" : "video"}
        fallbackImageUrl={front.fallbackImageUrl}
        preserveAlpha={isAlphaVideo}
        opacity={1}
      />
    </div>
  );
}

/** Re-export for editors / other layers that need the same still surface */
export { VideoFallbackSurface };
