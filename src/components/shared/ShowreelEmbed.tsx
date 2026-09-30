"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Film,
  Link2,
  Pencil,
  Play,
  Video,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditGate } from "@/components/shared/EditGate";
import { ImageUpload } from "@/components/shared/ImageUpload";
import {
  VideoFallbackSurface,
  VideoWithFallback,
} from "@/components/shared/VideoWithFallback";
import { VideoUpload } from "@/components/shared/VideoUpload";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type {
  FeatureVideo,
  FeatureVideoType,
  MainShowreel,
  Translatable,
} from "@/lib/types";
import { getL } from "@/lib/i18n-content";
import { LocalizedField } from "@/components/i18n/LocalizedField";
import {
  cn,
  isFileVideoUrl,
  isPortraitRatio,
  isXUrl,
  isYoutubeShort,
  isYoutubeUrl,
  xEmbedUrl,
  youtubeEmbedUrl,
  youtubeThumb,
} from "@/lib/utils";

type MediaSlot = {
  title: Translatable;
  description?: Translatable;
  videoType: FeatureVideoType;
  videoUrl: string | null;
  fallbackImageUrl?: string | null;
};

const VIDEO_TYPE_META: {
  type: FeatureVideoType;
  label: string;
  icon: typeof Film;
}[] = [
  { type: "none", label: "Aucune", icon: Film },
  { type: "youtube", label: "YouTube", icon: Video },
  { type: "x", label: "X", icon: Link2 },
  { type: "file", label: "Upload", icon: Film },
];

/** Main showreel: Upload / YouTube / X */
const MAIN_VIDEO_TYPES = VIDEO_TYPE_META;

/** Feature cards: Upload + YouTube only (no X) */
const FEATURE_VIDEO_TYPES = VIDEO_TYPE_META.filter((t) => t.type !== "x");

/** True when the element is sufficiently visible in the viewport */
function useInView<T extends HTMLElement>(
  threshold = 0.35,
  rootMargin = "64px"
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting && entry.intersectionRatio >= threshold);
      },
      { threshold: [0, threshold, 0.55, 0.8], rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, rootMargin]);

  return { ref, inView };
}

/** Detect natural aspect ratio of an uploaded video file (main showreel) */
function useVideoAspectRatio(
  videoType: FeatureVideoType,
  videoUrl: string | null
) {
  const [ratio, setRatio] = useState(16 / 9);

  useEffect(() => {
    if (videoType === "file" && videoUrl) {
      const el = document.createElement("video");
      el.preload = "metadata";
      el.src = videoUrl;
      const onMeta = () => {
        if (el.videoWidth > 0 && el.videoHeight > 0) {
          setRatio(el.videoWidth / el.videoHeight);
        } else {
          setRatio(16 / 9);
        }
      };
      el.addEventListener("loadedmetadata", onMeta);
      return () => {
        el.removeEventListener("loadedmetadata", onMeta);
        el.src = "";
      };
    }
    setRatio(16 / 9);
  }, [videoType, videoUrl]);

  return ratio;
}

/**
 * Media player for main showreel (adaptive frame, optional autoplay).
 */
function MediaPlayer({
  slot,
  autoplay = false,
  className,
  cover = false,
}: {
  slot: MediaSlot;
  autoplay?: boolean;
  className?: string;
  /** object-cover fill (feature cards) vs contain (main showreel default) */
  cover?: boolean;
}) {
  const { videoType, videoUrl, fallbackImageUrl } = slot;
  const title = getL(slot.title);

  if (videoType === "none" || !videoUrl) {
    return (
      <div className={cn("relative h-full w-full", className)}>
        <VideoFallbackSurface imageUrl={fallbackImageUrl} />
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 text-zinc-500">
          <Play className="h-8 w-8 opacity-40" />
          <span className="text-xs">Aucune vidéo</span>
        </div>
      </div>
    );
  }

  if (videoType === "youtube") {
    const thumb = fallbackImageUrl?.trim() || youtubeThumb(videoUrl);
    const src = youtubeEmbedUrl(videoUrl, {
      autoplay,
      mute: autoplay,
      loop: autoplay,
      controls: !autoplay,
    });
    return (
      <div className={cn("relative h-full w-full overflow-hidden", className)}>
        <VideoFallbackSurface imageUrl={thumb} />
        {src ? (
          <iframe
            key={src}
            src={src}
            title={title}
            className={cn(
              "absolute inset-0 z-[2] h-full w-full border-0",
              cover && "pointer-events-none scale-[1.35]"
            )}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen={!cover}
            tabIndex={cover ? -1 : undefined}
          />
        ) : null}
      </div>
    );
  }

  if (videoType === "x") {
    const src = xEmbedUrl(videoUrl);
    return (
      <div
        className={cn(
          "relative h-full w-full overflow-hidden",
          className
        )}
      >
        <VideoFallbackSurface imageUrl={fallbackImageUrl} />
        {src ? (
          <iframe
            src={src}
            title={title}
            className={
              cover
                ? // Crop tweet chrome → focus on media / video only
                  "pointer-events-none absolute left-1/2 top-[-8%] z-[2] h-[160%] w-[220%] max-w-none -translate-x-1/2 border-0"
                : "absolute inset-0 z-[2] h-full w-full border-0"
            }
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            tabIndex={cover ? -1 : undefined}
          />
        ) : (
          <div className="absolute inset-0 z-[2] flex h-full items-center justify-center text-2xl text-zinc-500">
            𝕏
          </div>
        )}
      </div>
    );
  }

  if (videoType === "file" || isFileVideoUrl(videoUrl)) {
    return (
      <VideoWithFallback
        src={videoUrl}
        fallbackImageUrl={fallbackImageUrl}
        className={cn("h-full w-full", className)}
        objectFit={cover ? "cover" : "contain"}
        controls={!autoplay}
        playsInline
        autoPlay={autoplay}
        muted={autoplay}
        loop={autoplay}
        preload="metadata"
        title={title}
      />
    );
  }

  return (
    <div className={cn("relative h-full w-full", className)}>
      <VideoFallbackSurface imageUrl={fallbackImageUrl} />
    </div>
  );
}

/**
 * Blurred background fill — same source, cover + ×3 scale.
 * (Must live inside an overflow-hidden parent.)
 */
const BLUR_BG =
  "pointer-events-none absolute left-1/2 top-1/2 h-full w-full min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 scale-[3] object-cover opacity-75 blur-md";

/**
 * Native video with "letterbox blur" fill:
 * - background: same video, object-cover + light blur + scale ×3
 * - foreground: original ratio, sharp & centered
 * - portrait / Shorts: fill card height (large), blur on sides
 * - landscape: fill card width, blur top/bottom
 */
function BlurFillVideo({
  src,
  title,
  active,
  poster,
}: {
  src: string;
  title: string;
  active: boolean;
  poster?: string | null;
}) {
  const fgRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLVideoElement>(null);
  /** width / height — null until metadata loads */
  const [aspect, setAspect] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setAspect(null);
    setReady(false);
    setFailed(false);
  }, [src]);

  useEffect(() => {
    if (failed) return;
    for (const el of [fgRef.current, bgRef.current]) {
      if (!el) continue;
      el.muted = true;
      el.defaultMuted = true;
      el.playsInline = true;
      if (active) {
        void el.play().catch(() => {
          /* autoplay policy — still keep frame if loaded */
        });
      } else {
        el.pause();
      }
    }
  }, [active, src, failed]);

  useEffect(() => {
    const fg = fgRef.current;
    const bg = bgRef.current;
    if (!fg || !bg) return;
    const onMeta = () => {
      if (fg.videoWidth > 0 && fg.videoHeight > 0) {
        setAspect(fg.videoWidth / fg.videoHeight);
      }
    };
    const onReady = () => setReady(true);
    const onError = () => {
      setFailed(true);
      setReady(false);
    };
    if (fg.readyState >= 1) onMeta();
    if (fg.readyState >= 2) onReady();
    fg.addEventListener("loadedmetadata", onMeta);
    fg.addEventListener("loadeddata", onReady);
    fg.addEventListener("canplay", onReady);
    fg.addEventListener("error", onError);
    bg.addEventListener("error", onError);

    const sync = () => {
      if (Math.abs(bg.currentTime - fg.currentTime) > 0.35) {
        try {
          bg.currentTime = fg.currentTime;
        } catch {
          /* ignore */
        }
      }
    };
    const onPlay = () => {
      void bg.play().catch(() => {});
    };
    const onPause = () => bg.pause();
    const onEnded = () => {
      fg.currentTime = 0;
      bg.currentTime = 0;
      void fg.play().catch(() => {});
      void bg.play().catch(() => {});
    };
    fg.addEventListener("timeupdate", sync);
    fg.addEventListener("seeked", sync);
    fg.addEventListener("play", onPlay);
    fg.addEventListener("pause", onPause);
    fg.addEventListener("ended", onEnded);
    return () => {
      fg.removeEventListener("loadedmetadata", onMeta);
      fg.removeEventListener("loadeddata", onReady);
      fg.removeEventListener("canplay", onReady);
      fg.removeEventListener("error", onError);
      bg.removeEventListener("error", onError);
      fg.removeEventListener("timeupdate", sync);
      fg.removeEventListener("seeked", sync);
      fg.removeEventListener("play", onPlay);
      fg.removeEventListener("pause", onPause);
      fg.removeEventListener("ended", onEnded);
    };
  }, [src]);

  // aspect = width/height; portrait when taller than wide (incl. 9:16 Shorts)
  const portraitVideo =
    aspect != null ? isPortraitRatio(aspect, 1) : false;
  const showVideo = ready && !failed;
  const fade = "opacity 450ms ease";

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Always-on still — custom poster or discreet placeholder */}
      <VideoFallbackSurface imageUrl={poster} className="z-0" />

      <video
        ref={bgRef}
        src={src}
        className={cn(BLUR_BG, "z-[1]")}
        style={{ opacity: showVideo ? 0.75 : 0, transition: fade }}
        muted
        playsInline
        loop
        autoPlay
        preload="auto"
        aria-hidden
        tabIndex={-1}
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-black/10"
        aria-hidden
        style={{ opacity: showVideo ? 1 : 0, transition: fade }}
      />
      {/*
        Foreground sized by detected ratio:
        - portrait: full height of card (big vertical), width from ratio
        - landscape: full width, height from ratio
        - unknown: object-contain fallback
      */}
      <div
        className="absolute inset-0 z-[2] flex items-center justify-center"
        style={{ opacity: showVideo ? 1 : 0, transition: fade }}
      >
        <video
          ref={fgRef}
          src={src}
          className={cn(
            "max-h-full max-w-full object-contain",
            aspect == null && "h-full w-full",
            portraitVideo && "h-full w-auto",
            aspect != null && !portraitVideo && "h-auto w-full"
          )}
          style={
            aspect != null
              ? portraitVideo
                ? { aspectRatio: String(aspect), height: "100%", width: "auto" }
                : { aspectRatio: String(aspect), width: "100%", height: "auto" }
              : undefined
          }
          muted
          playsInline
          loop
          autoPlay
          preload="auto"
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
          title={title}
        />
      </div>
    </div>
  );
}

/**
 * YouTube: ambient autoplay (no chrome) + blurred poster ×3 fill.
 * Landscape → 16:9 frame; Shorts / vertical → 9:16 frame filling card height.
 */
function BlurFillYouTube({
  embedSrc,
  title,
  posterUrl,
  vertical = false,
}: {
  embedSrc: string | null;
  title: string;
  posterUrl?: string | null;
  /** YouTube Short / 9:16 */
  vertical?: boolean;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base still — custom fallback, YT thumb, or discreet placeholder */}
      <VideoFallbackSurface imageUrl={posterUrl} className="z-0" />
      {posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl}
          alt=""
          className={cn(BLUR_BG, "z-[1]")}
          aria-hidden
        />
      ) : null}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-black/10"
        aria-hidden
      />
      <div className="absolute inset-0 z-[2] flex items-center justify-center">
        <div
          className={cn(
            "relative overflow-hidden",
            vertical
              ? // 9:16 — fill square card height, blur on the sides
                "h-full max-h-full w-auto max-w-full aspect-[9/16]"
              : // 16:9 — fill width of square card
                "aspect-video h-auto w-full max-h-full max-w-full"
          )}
        >
          {embedSrc && (
            <iframe
              key={embedSrc}
              src={embedSrc}
              title={title}
              // Scale slightly to crop residual YouTube chrome
              className="pointer-events-none absolute left-1/2 top-1/2 h-[118%] w-[118%] max-w-none -translate-x-1/2 -translate-y-1/2 border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              tabIndex={-1}
            />
          )}
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Feature card media — Upload + YouTube only.
 * Card frame is 1:1; video keeps original ratio with light blur fill behind.
 */
function FeatureCardMedia({ slot }: { slot: MediaSlot }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3, "80px");
  const { videoType, videoUrl, fallbackImageUrl } = slot;
  const title = getL(slot.title);

  // Legacy X entries on feature cards → empty state
  const effectiveType =
    videoType === "x" ? "none" : videoType;
  const effectiveUrl = effectiveType === "none" ? null : videoUrl;

  if (effectiveType === "none" || !effectiveUrl) {
    return (
      <div ref={ref} className="relative h-full w-full">
        <VideoFallbackSurface imageUrl={fallbackImageUrl} />
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 text-zinc-500">
          <Play className="h-7 w-7 opacity-35" />
          <span className="text-[11px]">Aucune vidéo</span>
        </div>
      </div>
    );
  }

  if (effectiveType === "file" || isFileVideoUrl(effectiveUrl)) {
    return (
      <div ref={ref} className="absolute inset-0">
        <BlurFillVideo
          src={effectiveUrl}
          title={title}
          active={inView}
          poster={fallbackImageUrl}
        />
      </div>
    );
  }

  if (effectiveType === "youtube") {
    const thumb =
      fallbackImageUrl?.trim() || youtubeThumb(effectiveUrl);
    const vertical = isYoutubeShort(effectiveUrl);
    const src = inView
      ? youtubeEmbedUrl(effectiveUrl, {
          autoplay: true,
          mute: true,
          loop: true,
          controls: false,
          hideChrome: true,
        })
      : null;

    return (
      <div ref={ref} className="absolute inset-0">
        <BlurFillYouTube
          embedSrc={src}
          title={title}
          posterUrl={thumb}
          vertical={vertical}
        />
      </div>
    );
  }

  return (
    <div ref={ref} className="absolute inset-0">
      <VideoFallbackSurface imageUrl={fallbackImageUrl} />
    </div>
  );
}

/** Square (1:1) glass card under the showreel */
function FeatureVideoCard({
  video,
  index,
}: {
  video: FeatureVideo;
  index: number;
}) {
  const { l } = usePortfolio();
  const title = l(video.title);
  const description = l(video.description);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.06, duration: 0.4 }}
      className="min-w-0"
    >
      <GlassCard
        glow
        className="group relative w-full overflow-hidden p-0"
      >
        {/* Square frame — 1:1 desktop & mobile */}
        <div className="relative aspect-square w-full overflow-hidden bg-black">
          <FeatureCardMedia slot={video} />

          {/* Glass edge + readability gradient */}
          <div
            className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 via-black/45 to-transparent"
            aria-hidden
          />

          {/* Title + short description as glass badge */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-1.5 sm:p-3.5 md:p-4">
            <span
              className={cn(
                "glass-chip inline-flex max-w-full flex-col items-center justify-center",
                "rounded-2xl px-2 py-1 sm:rounded-full sm:px-3.5 sm:py-1.5 md:px-4 md:py-2",
                "border border-white/18",
                "text-center font-semibold leading-snug tracking-tight text-zinc-50",
                "shadow-[0_8px_24px_-8px_rgba(0,0,0,0.55)]"
              )}
            >
              <span className="max-w-full truncate text-[10px] sm:text-xs md:text-sm">
                {title}
              </span>
              {description ? (
                <span className="mt-0.5 max-w-full text-[10px] font-normal leading-tight text-zinc-200/80 max-sm:hidden sm:line-clamp-2 md:text-[11px]">
                  {description}
                </span>
              ) : null}
            </span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function AdaptiveMediaFrame({
  slot,
  autoplay,
  className,
}: {
  slot: MediaSlot;
  autoplay?: boolean;
  className?: string;
}) {
  const ratio = useVideoAspectRatio(slot.videoType, slot.videoUrl);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-inner ring-1 ring-inset ring-white/5",
        className
      )}
      style={{ aspectRatio: String(ratio) }}
    >
      <MediaPlayer slot={slot} autoplay={autoplay} />
    </div>
  );
}

function cleanSlot(
  title: Translatable,
  videoType: FeatureVideoType,
  videoUrl: string | null,
  label: string,
  options?: {
    allowX?: boolean;
    fallbackImageUrl?: string | null;
    description?: Translatable;
  }
): { ok: true; slot: MediaSlot } | { ok: false; error: string } {
  let type = videoType;
  let url = videoUrl;
  const allowX = options?.allowX ?? true;
  const fallback =
    typeof options?.fallbackImageUrl === "string" &&
    options.fallbackImageUrl.trim()
      ? options.fallbackImageUrl.trim()
      : null;
  const description = options?.description;

  // Feature cards: drop legacy X
  if (!allowX && type === "x") {
    type = "none";
    url = null;
  }

  if (type === "youtube") {
    const u = (url || "").trim();
    if (u && !isYoutubeUrl(u)) {
      return { ok: false, error: `« ${label} » : lien YouTube invalide.` };
    }
    if (!u) {
      type = "none";
      url = null;
    } else url = u;
  } else if (type === "x") {
    const u = (url || "").trim();
    if (u && !isXUrl(u)) {
      return { ok: false, error: `« ${label} » : lien X invalide.` };
    }
    if (!u) {
      type = "none";
      url = null;
    } else url = u;
  } else if (type === "file") {
    if (!url) {
      type = "none";
      url = null;
    }
  } else {
    type = "none";
    url = null;
  }

  return {
    ok: true,
    slot: {
      title: getL(title).trim() ? title : label,
      description:
        description && getL(description).trim() ? description : undefined,
      videoType: type,
      videoUrl: type === "none" ? null : url,
      fallbackImageUrl: type === "none" ? null : fallback,
    },
  };
}

function SlotEditor({
  heading,
  title,
  description,
  videoType,
  videoUrl,
  fallbackImageUrl,
  onChange,
  types = MAIN_VIDEO_TYPES,
  showDescription = false,
}: {
  heading: string;
  title: Translatable;
  description?: Translatable;
  videoType: FeatureVideoType;
  videoUrl: string | null;
  fallbackImageUrl?: string | null;
  onChange: (partial: Partial<MediaSlot>) => void;
  types?: typeof MAIN_VIDEO_TYPES;
  showDescription?: boolean;
}) {
  const cols =
    types.length <= 3 ? "grid-cols-3" : "grid-cols-4";

  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
        {heading}
      </p>
      <LocalizedField
        label="Titre"
        value={title}
        onChange={(next) => onChange({ title: next })}
        placeholder="Ex. Showreel, Motion design…"
      />
      {showDescription ? (
        <LocalizedField
          label="Description courte"
          value={description}
          onChange={(next) => onChange({ description: next })}
          placeholder="Ex. Habillages, lower-thirds et animations de marque."
          multiline
          rows={2}
          plain
        />
      ) : null}
      <div className="grid gap-2">
        <Label>Type de média</Label>
        <div className={cn("grid gap-1.5", cols)}>
          {types.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                onChange({
                  videoType: type,
                  videoUrl:
                    type === "none"
                      ? null
                      : type === videoType
                        ? videoUrl
                        : type === "file"
                          ? videoType === "file"
                            ? videoUrl
                            : null
                          : type === "youtube" || type === "x"
                            ? videoType === type
                              ? videoUrl
                              : ""
                            : null,
                  fallbackImageUrl:
                    type === "none" ? null : fallbackImageUrl ?? null,
                });
              }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[10px] font-medium",
                videoType === type
                  ? "border-teal-300/40 bg-teal-300/15 text-teal-100"
                  : "border-white/10 bg-black/20 text-zinc-400"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {(videoType === "youtube" || videoType === "x") && (
        <div className="grid gap-2">
          <Label>
            {videoType === "youtube" ? "Lien YouTube" : "Lien X (post / vidéo)"}
          </Label>
          <Input
            value={videoUrl ?? ""}
            onChange={(e) => onChange({ videoUrl: e.target.value })}
            placeholder={
              videoType === "youtube"
                ? "https://youtu.be/…"
                : "https://x.com/…/status/…"
            }
          />
        </div>
      )}

      {videoType === "file" && (
        <VideoUpload
          value={videoUrl && isFileVideoUrl(videoUrl) ? videoUrl : null}
          onChange={(url) => onChange({ videoUrl: url })}
          label="Upload vidéo légère (Blob) — showreel long → YouTube"
          folder="patrick-roziel/showreel"
        />
      )}

      {videoType !== "none" && (
        <div className="grid gap-2">
          <Label className="text-xs text-zinc-400">
            Image de secours (si la vidéo ne charge pas)
          </Label>
          <p className="text-[10px] leading-relaxed text-zinc-500">
            Affichée pendant le chargement et en cas d’erreur / format non
            supporté. Si vide : placeholder discret.
          </p>
          <ImageUpload
            value={fallbackImageUrl ?? null}
            onChange={(url) => onChange({ fallbackImageUrl: url })}
            aspectClassName="aspect-video max-h-32"
            label="Upload image de secours (JPG, PNG, WebP)"
            folder="patrick-roziel/showreel"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Main showreel + 3 square (1:1) feature cards.
 */
export function ShowreelEmbed({ className }: { className?: string }) {
  const {
    data,
    updateMainShowreel,
    updateFeatureVideos,
    editMode,
    l,
  } = usePortfolio();

  const main = data.mainShowreel ?? {
    title: "Showreel",
    videoType: "youtube" as const,
    videoUrl: data.profile.showreelUrl || null,
  };
  const featureVideos = data.featureVideos ?? [];

  const [editOpen, setEditOpen] = useState(false);
  const [draftMain, setDraftMain] = useState<MainShowreel>(main);
  const [draftFeatures, setDraftFeatures] =
    useState<FeatureVideo[]>(featureVideos);
  const [error, setError] = useState<string | null>(null);

  const openEdit = () => {
    setDraftMain({ ...main });
    setDraftFeatures(featureVideos.map((f) => ({ ...f })));
    setError(null);
    setEditOpen(true);
  };

  const handleSave = () => {
    setError(null);

    const mainResult = cleanSlot(
      draftMain.title,
      draftMain.videoType,
      draftMain.videoUrl,
      "Showreel",
      {
        allowX: true,
        fallbackImageUrl: draftMain.fallbackImageUrl,
      }
    );
    if (!mainResult.ok) {
      setError(mainResult.error);
      return;
    }

    const cleanedFeatures: FeatureVideo[] = [];
    for (let i = 0; i < draftFeatures.length; i++) {
      const f = draftFeatures[i];
      const r = cleanSlot(
        f.title,
        f.videoType,
        f.videoUrl,
        getL(f.title) || `Carte ${i + 1}`,
        {
          allowX: false,
          fallbackImageUrl: f.fallbackImageUrl,
          description: f.description,
        }
      );
      if (!r.ok) {
        setError(r.error);
        return;
      }
      cleanedFeatures.push({
        id: f.id,
        ...r.slot,
      });
    }

    updateMainShowreel(mainResult.slot);
    updateFeatureVideos(cleanedFeatures);
    setEditOpen(false);
  };

  const hasMain = main.videoType !== "none" && Boolean(main.videoUrl);
  const hasAnyFeature = featureVideos.some(
    (f) => f.videoType !== "none" && f.videoUrl
  );

  if (!hasMain && !hasAnyFeature && !editMode) {
    return null;
  }

  return (
    <>
      <motion.div
        id="showreel"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className={cn("w-full space-y-5 sm:space-y-6", className)}
      >
        {/* Main showreel card — title badge bottom-centered (same as feature cards) */}
        <GlassCard className="group relative w-full overflow-hidden p-0">
          <EditGate>
            <div className="absolute right-3 top-3 z-20 sm:right-4 sm:top-4">
              <Button variant="secondary" size="sm" onClick={openEdit}>
                <Pencil className="h-3.5 w-3.5" />
                Modifier vidéos
              </Button>
            </div>
          </EditGate>

          {hasMain ? (
            <div className="relative w-full overflow-hidden bg-black">
              <AdaptiveMediaFrame
                slot={main}
                autoplay={
                  main.videoType === "youtube" ||
                  main.videoType === "file" ||
                  main.videoType === "x"
                }
                className="rounded-none border-0 shadow-none ring-0"
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 via-black/45 to-transparent"
                aria-hidden
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-3.5 sm:p-4">
                <h2 className="min-w-0 max-w-[90%]">
                  <span
                    className={cn(
                      "glass-chip inline-flex max-w-full items-center justify-center",
                      "rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2",
                      "border border-white/18",
                      "text-center text-xs font-semibold leading-snug tracking-tight text-zinc-50",
                      "shadow-[0_8px_24px_-8px_rgba(0,0,0,0.55)]",
                      "sm:text-sm"
                    )}
                  >
                    <span className="truncate">{l(main.title)}</span>
                  </span>
                </h2>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <p className="text-sm text-zinc-400">
                Aucune vidéo principale. Configurez-la en Mode Édition.
              </p>
              {editMode && (
                <Button size="sm" onClick={openEdit}>
                  Configurer les vidéos
                </Button>
              )}
            </div>
          )}
        </GlassCard>

        {/* Feature-card data is intentionally preserved but no longer rendered. */}
      </motion.div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent size="form" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Showreel</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5">
            <SlotEditor
              heading="Carte principale (Showreel)"
              title={draftMain.title}
              videoType={draftMain.videoType}
              videoUrl={draftMain.videoUrl}
              fallbackImageUrl={draftMain.fallbackImageUrl}
              onChange={(partial) =>
                setDraftMain((m) => ({ ...m, ...partial }))
              }
            />

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSave}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
