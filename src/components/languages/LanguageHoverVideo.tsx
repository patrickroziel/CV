"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { LanguageVideoType } from "@/lib/types";
import {
  VideoFallbackSurface,
} from "@/components/shared/VideoWithFallback";
import { cn, youtubeEmbedUrl, xEmbedUrl, youtubeThumb } from "@/lib/utils";

export type LanguageHoverVideoHandle = {
  /** Call from mouseenter / tap — keeps user gesture so audio is allowed */
  playUnmuted: () => void;
  /** Pause without resetting (tap-to-pause on mobile) */
  pause: () => void;
  /** Resume from pause without resetting (tap-to-resume) */
  resume: () => void;
  /** Pause + reset to start */
  stop: () => void;
};

type LanguageHoverVideoProps = {
  videoType: LanguageVideoType;
  videoUrl: string | null;
  /** Still while loading / if the video fails */
  fallbackImageUrl?: string | null;
  languageName: string;
  className?: string;
  /** Card is hovered — show layer / keep playing */
  active: boolean;
};

/**
 * Language demo video — plays WITH sound on hover (not muted).
 * File uploads: keep element mounted and start play from playUnmuted()
 * so the browser treats it as a user gesture.
 *
 * Always renders a still underlay (custom fallback or discreet placeholder)
 * so load/error never leaves a black hole.
 */
export const LanguageHoverVideo = forwardRef<
  LanguageHoverVideoHandle,
  LanguageHoverVideoProps
>(function LanguageHoverVideo(
  {
    videoType,
    videoUrl,
    fallbackImageUrl,
    languageName,
    className,
    active,
  },
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  /** Hard failure: format unsupported / network / decode */
  const [loadError, setLoadError] = useState(false);
  /** Soft hint: browser blocked unmuted play (video may still be loaded) */
  const [playHint, setPlayHint] = useState(false);
  const [fileReady, setFileReady] = useState(false);

  useImperativeHandle(
    ref,
    () => {
      const tryPlayFrom = (el: HTMLVideoElement, reset: boolean) => {
        setPlayHint(false);
        el.defaultMuted = false;
        el.muted = false;
        el.volume = 1;
        if (reset) {
          try {
            el.currentTime = 0;
          } catch {
            /* ignore */
          }
        }
        const run = () => {
          el.muted = false;
          el.volume = 1;
          const p = el.play();
          if (p !== undefined) {
            void p.catch(() => {
              // Autoplay-with-sound blocked — keep video frame if ready
              setPlayHint(true);
            });
          }
        };
        if (el.readyState >= 2) {
          run();
        } else {
          el.load();
          el.addEventListener("canplay", run, { once: true });
        }
      };

      return {
        playUnmuted: () => {
          const el = videoRef.current;
          if (!el || videoType !== "file") return;
          tryPlayFrom(el, true);
        },
        pause: () => {
          const el = videoRef.current;
          if (!el) return;
          el.pause();
        },
        resume: () => {
          const el = videoRef.current;
          if (!el || videoType !== "file") return;
          tryPlayFrom(el, false);
        },
        stop: () => {
          const el = videoRef.current;
          if (!el) return;
          el.pause();
          try {
            el.currentTime = 0;
          } catch {
            /* ignore */
          }
        },
      };
    },
    [videoType]
  );

  // Ensure file is paused when demo layer deactivates (reset is via stop())
  useEffect(() => {
    if (active || videoType !== "file") return;
    const el = videoRef.current;
    if (!el) return;
    el.pause();
  }, [active, videoType]);

  // Reset error / ready when source changes
  useEffect(() => {
    setLoadError(false);
    setPlayHint(false);
    setFileReady(false);
  }, [videoUrl, videoType]);

  if (videoType === "none" || !videoUrl) return null;

  const stillUrl =
    fallbackImageUrl?.trim() ||
    (videoType === "youtube" ? youtubeThumb(videoUrl) : null);

  // —— File (upload) — always mounted so playUnmuted works on gesture ——
  if (videoType === "file") {
    const showVideo = fileReady && !loadError;
    return (
      <div
        className={cn(
          "absolute inset-0 z-[1] overflow-hidden transition-opacity duration-300",
          active ? "opacity-100" : "pointer-events-none opacity-0",
          className
        )}
        aria-hidden={!active}
      >
        <VideoFallbackSurface imageUrl={stillUrl} />
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 z-[2] h-full w-full object-cover transition-opacity duration-500 ease-out"
          style={{ opacity: showVideo ? 1 : 0 }}
          playsInline
          loop
          // Explicitly NOT muted — language demos need audio
          muted={false}
          preload="auto"
          controls={false}
          onLoadedData={() => setFileReady(true)}
          onCanPlay={() => setFileReady(true)}
          onError={() => {
            setLoadError(true);
            setFileReady(false);
          }}
        />
        {active && loadError && (
          <div className="absolute inset-0 z-[3] flex items-center justify-center bg-black/40 px-4 text-center text-xs text-zinc-200 transition-opacity duration-300">
            Vidéo indisponible — image de secours affichée.
          </div>
        )}
        {active && playHint && !loadError && (
          <div className="absolute inset-0 z-[3] flex items-center justify-center bg-black/50 px-4 text-center text-xs text-zinc-200 transition-opacity duration-300">
            Lecture avec son impossible — cliquez une fois sur la page puis
            re-survolez.
          </div>
        )}
      </div>
    );
  }

  // YouTube / X only when active (iframe autoplay-with-sound is limited by browsers)
  if (!active) return null;

  if (videoType === "youtube") {
    // Prefer unmuted; browsers may still force mute on iframe autoplay
    const playSrc = youtubeEmbedUrl(videoUrl, {
      autoplay: true,
      mute: false,
      loop: true,
      controls: false,
    });
    return (
      <div
        className={cn(
          "absolute inset-0 z-[1] overflow-hidden",
          className
        )}
      >
        <VideoFallbackSurface imageUrl={stillUrl} />
        {playSrc ? (
          <iframe
            key={playSrc}
            className="pointer-events-none absolute inset-0 z-[2] h-full w-full scale-[1.12]"
            src={playSrc}
            title={`Démo — ${languageName}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            tabIndex={-1}
          />
        ) : null}
      </div>
    );
  }

  if (videoType === "x") {
    const embed = xEmbedUrl(videoUrl);
    return (
      <div
        className={cn(
          "absolute inset-0 z-[1] overflow-hidden",
          className
        )}
      >
        <VideoFallbackSurface imageUrl={stillUrl} />
        {embed ? (
          <iframe
            key={embed}
            className="pointer-events-none absolute left-1/2 top-0 z-[2] h-[160%] w-[120%] max-w-none -translate-x-1/2 border-0"
            src={embed}
            title={`Post X — ${languageName}`}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            tabIndex={-1}
          />
        ) : null}
      </div>
    );
  }

  return null;
});
