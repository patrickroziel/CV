"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type VideoHTMLAttributes,
} from "react";
import { Film } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Soft still surface under every video:
 * - custom fallback image when provided
 * - discreet gradient + icon otherwise (never pure black)
 */
export function VideoFallbackSurface({
  imageUrl,
  className,
  iconClassName,
  alt = "",
}: {
  imageUrl?: string | null;
  className?: string;
  iconClassName?: string;
  alt?: string;
}) {
  const src = imageUrl?.trim() || null;
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden={alt ? undefined : true}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full flex-col items-center justify-center gap-2",
            "bg-gradient-to-br from-zinc-800/95 via-zinc-900 to-zinc-950",
            "ring-1 ring-inset ring-white/[0.06]"
          )}
        >
          <Film
            className={cn(
              "h-7 w-7 text-zinc-500/70 sm:h-8 sm:w-8",
              iconClassName
            )}
          />
        </div>
      )}
    </div>
  );
}

export type VideoWithFallbackHandle = {
  video: HTMLVideoElement | null;
};

type VideoWithFallbackProps = {
  src: string;
  /** Custom still if video fails / while loading */
  fallbackImageUrl?: string | null;
  className?: string;
  /** Classes on the <video> element */
  videoClassName?: string;
  /** object-cover (default) | object-contain */
  objectFit?: "cover" | "contain";
  /**
   * When true, keep the still fully opaque until the first frame is ready,
   * then crossfade. When video fails, still stays visible.
   */
  fadeDurationMs?: number;
  /**
   * WebM/MOV with alpha channel: no opaque underlay while playing so
   * transparent pixels reveal content behind the video layer.
   */
  preserveAlpha?: boolean;
  /**
   * Fill a positioned parent (absolute inset-0). Root becomes absolute and
   * never contributes to document flow / parent sizing.
   */
  fill?: boolean;
  /** Called when the video reports a hard load/playback error */
  onFallback?: () => void;
  /** Called when the first frame is ready */
  onReady?: () => void;
} & Omit<
  VideoHTMLAttributes<HTMLVideoElement>,
  "src" | "className" | "poster" | "onError" | "onLoadedData" | "onCanPlay"
>;

/**
 * Native <video> with optional still underlay.
 *
 * States:
 * - loading → still (image or placeholder) visible, video opacity 0
 * - ready   → soft crossfade to video
 * - error   → video hidden, still remains (never black hole)
 *
 * With `preserveAlpha`, the underlay hides once the first frame is ready
 * so alpha / transparent pixels composite correctly.
 */
export const VideoWithFallback = forwardRef<
  VideoWithFallbackHandle,
  VideoWithFallbackProps
>(function VideoWithFallback(
  {
    src,
    fallbackImageUrl,
    className,
    videoClassName,
    objectFit = "cover",
    fadeDurationMs = 450,
    preserveAlpha = false,
    fill = false,
    onFallback,
    onReady,
    autoPlay,
    muted,
    loop,
    playsInline = true,
    controls,
    preload = "metadata",
    ...rest
  },
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      get video() {
        return videoRef.current;
      },
    }),
    []
  );

  // Reset when source changes
  useEffect(() => {
    setReady(false);
    setFailed(false);
  }, [src]);

  // Ensure autoplay after mount (Safari sometimes needs play())
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !autoPlay) return;
    const tryPlay = () => {
      void el.play().catch(() => {
        /* autoplay policy — muted+playsInline should allow it */
      });
    };
    tryPlay();
    el.addEventListener("loadeddata", tryPlay);
    return () => el.removeEventListener("loadeddata", tryPlay);
  }, [src, autoPlay]);

  const markReady = () => {
    setReady((prev) => {
      if (!prev) onReady?.();
      return true;
    });
  };

  const markFailed = () => {
    setFailed(true);
    setReady(false);
    onFallback?.();
  };

  const showVideo = ready && !failed;
  const transition = `opacity ${fadeDurationMs}ms ease`;
  // Alpha videos: hide solid underlay once playing so transparency works
  const showUnderlay = !preserveAlpha || !showVideo;

  return (
    <div
      className={cn(
        fill
          ? "absolute inset-0 h-full w-full min-h-0 min-w-0 overflow-hidden"
          : "relative h-full w-full min-h-0 min-w-0 overflow-hidden",
        preserveAlpha && "bg-transparent",
        className
      )}
    >
      {showUnderlay && (
        <VideoFallbackSurface
          imageUrl={fallbackImageUrl}
          className={cn(
            preserveAlpha && "transition-opacity",
            preserveAlpha && showVideo && "opacity-0"
          )}
        />
      )}

      {/* Soft loading veil only while waiting and no custom still (non-alpha) */}
      {!showVideo && !fallbackImageUrl?.trim() && !preserveAlpha && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] animate-pulse bg-white/[0.03]"
          aria-hidden
          style={{ transition }}
        />
      )}

      <video
        ref={videoRef}
        src={src}
        className={cn(
          "absolute inset-0 z-[2] h-full w-full max-h-none max-w-none min-h-0 min-w-0 bg-transparent",
          objectFit === "cover" ? "object-cover object-center" : "object-contain",
          videoClassName
        )}
        style={{
          opacity: showVideo ? 1 : 0,
          transition,
          // Critical for WebM/VP9 & HEVC alpha compositing
          backgroundColor: "transparent",
          mixBlendMode: preserveAlpha ? "normal" : undefined,
        }}
        autoPlay={autoPlay}
        muted={muted ?? true}
        loop={loop}
        playsInline={playsInline}
        controls={controls}
        preload={preload}
        onLoadedData={markReady}
        onCanPlay={markReady}
        onError={markFailed}
        {...rest}
      />
    </div>
  );
});
