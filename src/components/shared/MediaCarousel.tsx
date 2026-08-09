"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
} from "lucide-react";
import type { MediaItem } from "@/lib/types";
import { getL } from "@/lib/i18n-content";
import {
  cn,
  youtubeEmbedUrl,
  youtubeThumb,
  xEmbedUrl,
  isFileVideoUrl,
} from "@/lib/utils";

type MediaCarouselProps = {
  items: MediaItem[];
  className?: string;
  /** @deprecated kept for call sites — carousel is always square multi-card */
  compact?: boolean;
};

const MAX_DESKTOP = 3;
const GAP_PX = 14;

/** Per-card mute preference — survives re-renders, keyed by media id */
const muteById = new Map<string, boolean>();

function getMuted(id: string): boolean {
  return muteById.get(id) ?? true;
}
function setMutedStore(id: string, muted: boolean) {
  muteById.set(id, muted);
}

function useVisibleCount() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w >= 640) setCount(MAX_DESKTOP);
      else if (w >= 420) setCount(2);
      else setCount(1);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return count;
}

function SoundToggle({
  muted,
  onToggle,
}: {
  muted: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "absolute bottom-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full",
        "border border-white/20 bg-black/55 text-zinc-100 shadow-lg backdrop-blur-md",
        "transition hover:border-teal-300/40 hover:bg-black/70 hover:text-teal-100"
      )}
      aria-label={muted ? "Activer le son" : "Couper le son"}
      title={muted ? "Son" : "Muet"}
    >
      {muted ? (
        <VolumeX className="h-3.5 w-3.5" />
      ) : (
        <Volume2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

/**
 * File video — mounts once per id (stable key on track), never resets
 * currentTime on hover / page change / mute. Always loop + autoplay.
 */
function FileVideoSlide({
  id,
  url,
  caption,
}: {
  id: string;
  url: string;
  caption?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(() => getMuted(id));

  // Mute only — never touch currentTime
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = muted;
    setMutedStore(id, muted);
  }, [id, muted]);

  // Kick autoplay once on mount; resume if browser paused (tab return)
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const tryPlay = () => {
      void v.play().catch(() => {
        /* autoplay policy */
      });
    };
    tryPlay();
    const onVis = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [url]);

  return (
    <div className="absolute inset-0">
      <video
        ref={ref}
        src={url}
        className="h-full w-full object-cover"
        autoPlay
        muted={muted}
        loop
        playsInline
        preload="auto"
        aria-label={caption || "Vidéo"}
      />
      <SoundToggle
        muted={muted}
        onToggle={() => setMuted((m) => !m)}
      />
    </div>
  );
}

function YoutubeSlide({
  id,
  url,
  caption,
}: {
  id: string;
  url: string;
  caption?: string;
}) {
  const [muted, setMuted] = useState(() => getMuted(id));

  useEffect(() => {
    setMutedStore(id, muted);
  }, [id, muted]);

  // Keep iframe mounted always; only remount when user toggles mute.
  const src = youtubeEmbedUrl(url, {
    autoplay: true,
    mute: muted,
    loop: true,
    controls: false,
    hideChrome: true,
  });
  const thumb = youtubeThumb(url);

  if (!src) {
    return thumb ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={thumb}
        alt={caption || "YouTube"}
        className="h-full w-full object-cover"
      />
    ) : null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-zinc-900">
      <div className="absolute left-1/2 top-1/2 h-full w-[177.78%] -translate-x-1/2 -translate-y-1/2">
        <iframe
          key={`${id}-mute-${muted ? "1" : "0"}`}
          src={src}
          title={caption || "YouTube"}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <SoundToggle
        muted={muted}
        onToggle={() => setMuted((m) => !m)}
      />
    </div>
  );
}

function MediaCard({ item }: { item: MediaItem }) {
  const caption = getL(item.caption);
  const kind: MediaItem["type"] | "image" =
    item.type ||
    (item.url.startsWith("data:image")
      ? "image"
      : isFileVideoUrl(item.url)
        ? "file"
        : "image");

  return (
    <div
      className={cn(
        "group/card relative aspect-square w-full overflow-hidden rounded-2xl",
        "border border-white/15 bg-black/40",
        "shadow-[0_8px_28px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.12)]",
        "backdrop-blur-md",
        // Hover: soft glow + light scale on shell only — no video remount
        "transition-[transform,box-shadow,border-color] duration-300 ease-out",
        "hover:z-[1] hover:scale-[1.02] hover:border-teal-300/35",
        "hover:shadow-[0_0_0_1px_rgba(94,234,212,0.22),0_12px_36px_-10px_rgba(94,234,212,0.22)]"
      )}
    >
      {kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.url}
          alt={caption || "Média"}
          className="h-full w-full object-cover"
          draggable={false}
        />
      )}

      {kind === "youtube" && (
        <YoutubeSlide id={item.id} url={item.url} caption={caption} />
      )}

      {kind === "x" &&
        (() => {
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
        })()}

      {kind === "file" && (
        <FileVideoSlide id={item.id} url={item.url} caption={caption} />
      )}

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent"
        aria-hidden
      />

      {caption && (
        <p className="pointer-events-none absolute bottom-2 left-2 right-10 z-[1] truncate text-[10px] font-medium text-zinc-100/90 drop-shadow">
          {caption}
        </p>
      )}

      {(kind === "youtube" || kind === "file") && (
        <span className="pointer-events-none absolute left-2 top-2 z-[1] inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-200 backdrop-blur-md">
          <Play className="h-2.5 w-2.5 fill-current" />
          {kind === "youtube" ? "YT" : "Vidéo"}
        </span>
      )}
    </div>
  );
}

export function MediaCarousel({ items, className }: MediaCarouselProps) {
  const visibleCount = useVisibleCount();
  const reducedMotion = useReducedMotion();
  const [start, setStart] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [cardW, setCardW] = useState(200);
  const touchStartX = useRef<number | null>(null);

  const list = items ?? [];
  const total = list.length;
  const step = cardW + GAP_PX;

  useEffect(() => {
    if (total === 0) return;
    const maxStart = Math.max(0, total - visibleCount);
    setStart((s) => Math.min(s, maxStart));
  }, [total, visibleCount]);

  // Card size from viewport: fill up to `visibleCount` slots, cap ~220px
  useLayoutEffect(() => {
    const measure = () => {
      const vw = viewportRef.current?.clientWidth ?? 0;
      if (vw <= 0) return;
      const gaps = GAP_PX * Math.max(0, visibleCount - 1);
      const ideal = Math.floor((vw - gaps) / visibleCount);
      // Desktop target ~180–220px; mobile a bit smaller but still readable
      setCardW(Math.min(220, Math.max(148, ideal)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [visibleCount, total]);

  const maxStart = Math.max(0, total - visibleCount);
  const canNav = total > visibleCount;

  const goTo = useCallback(
    (nextStart: number) => {
      const clamped = Math.max(0, Math.min(maxStart, nextStart));
      setStart(clamped);
    },
    [maxStart]
  );

  const prev = useCallback(() => goTo(start - 1), [goTo, start]);
  const next = useCallback(() => goTo(start + 1), [goTo, start]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx > 0) prev();
    else next();
  };

  if (!total) return null;

  const from = start + 1;
  const to = Math.min(start + visibleCount, total);
  const counterLabel = canNav
    ? from === to
      ? `${from} / ${total}`
      : `${from}–${to} / ${total}`
    : total === 1
      ? "1 média"
      : `${total} médias`;

  const offsetX = canNav ? -start * step : 0;

  // Premium spring (~400–500ms feel) / reduced-motion: short ease
  const trackTransition = reducedMotion
    ? { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }
    : {
        type: "spring" as const,
        stiffness: 240,
        damping: 32,
        mass: 0.85,
      };

  return (
    <div className={cn("relative w-full", className)}>
      <div
        ref={viewportRef}
        className={cn(
          "relative w-full overflow-hidden",
          // Slight padding so hover scale doesn't clip glow
          "py-1"
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <motion.div
          ref={trackRef}
          className={cn(
            "flex w-max will-change-transform",
            // Center when everything fits
            !canNav && "mx-auto"
          )}
          style={{ gap: GAP_PX }}
          // Continuous track: cards stay mounted → video currentTime preserved
          initial={false}
          animate={{ x: offsetX }}
          transition={trackTransition}
        >
          {list.map((item) => (
            <div
              key={item.id}
              className="min-w-0 shrink-0"
              style={{ width: cardW }}
            >
              <MediaCard item={item} />
            </div>
          ))}
        </motion.div>
      </div>

      {total > 1 && (
        <div className="mt-3 flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-2">
            {canNav && (
              <button
                type="button"
                onClick={prev}
                disabled={start <= 0}
                aria-label="Précédent"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  "border border-white/15 bg-white/5 text-zinc-200 backdrop-blur-md",
                  "transition hover:border-teal-300/35 hover:bg-teal-300/10 hover:text-teal-100",
                  "disabled:pointer-events-none disabled:opacity-30"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            <span
              className={cn(
                "rounded-full border border-white/12 bg-white/5 px-2.5 py-1",
                "text-[11px] font-medium tabular-nums tracking-wide text-zinc-300 backdrop-blur-md"
              )}
              aria-live="polite"
            >
              {counterLabel}
            </span>

            {canNav && (
              <button
                type="button"
                onClick={next}
                disabled={start >= maxStart}
                aria-label="Suivant"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  "border border-white/15 bg-white/5 text-zinc-200 backdrop-blur-md",
                  "transition hover:border-teal-300/35 hover:bg-teal-300/10 hover:text-teal-100",
                  "disabled:pointer-events-none disabled:opacity-30"
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {canNav && (
            <div className="flex justify-center gap-1.5">
              {Array.from({ length: maxStart + 1 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Page ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === start
                      ? "w-4 bg-teal-300 shadow-[0_0_8px_rgba(94,234,212,0.55)]"
                      : "w-1.5 bg-white/30 hover:bg-white/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
