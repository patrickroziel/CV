"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { LanguageVideoType } from "@/lib/types";
import { cn, youtubeEmbedUrl, xEmbedUrl } from "@/lib/utils";

export type LanguageHoverVideoHandle = {
  /** Call from mouseenter — keeps user gesture so audio is allowed */
  playUnmuted: () => void;
  stop: () => void;
};

type LanguageHoverVideoProps = {
  videoType: LanguageVideoType;
  videoUrl: string | null;
  languageName: string;
  className?: string;
  /** Card is hovered — show layer / keep playing */
  active: boolean;
};

/**
 * Language demo video — plays WITH sound on hover (not muted).
 * File uploads: keep element mounted and start play from playUnmuted()
 * so the browser treats it as a user gesture.
 */
export const LanguageHoverVideo = forwardRef<
  LanguageHoverVideoHandle,
  LanguageHoverVideoProps
>(function LanguageHoverVideo(
  { videoType, videoUrl, languageName, className, active },
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fileError, setFileError] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      playUnmuted: () => {
        const el = videoRef.current;
        if (!el || videoType !== "file") return;
        setFileError(false);
        el.defaultMuted = false;
        el.muted = false;
        el.volume = 1;
        try {
          el.currentTime = 0;
        } catch {
          /* ignore */
        }
        const tryPlay = () => {
          el.muted = false;
          el.volume = 1;
          const p = el.play();
          if (p !== undefined) {
            void p.catch(() => {
              // Do not fall back to muted — language demos need audio
              setFileError(true);
            });
          }
        };
        if (el.readyState >= 2) {
          tryPlay();
        } else {
          el.load();
          el.addEventListener("canplay", tryPlay, { once: true });
        }
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
    }),
    [videoType]
  );

  // Pause when leaving hover
  useEffect(() => {
    if (active || videoType !== "file") return;
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    try {
      el.currentTime = 0;
    } catch {
      /* ignore */
    }
  }, [active, videoType]);

  // Reset error when source changes
  useEffect(() => {
    setFileError(false);
  }, [videoUrl, videoType]);

  if (videoType === "none" || !videoUrl) return null;

  // —— File (upload) — always mounted so playUnmuted works on gesture ——
  if (videoType === "file") {
    return (
      <div
        className={cn(
          "absolute inset-0 z-[1] overflow-hidden bg-black/90 transition-opacity duration-300",
          active ? "opacity-100" : "pointer-events-none opacity-0",
          className
        )}
        aria-hidden={!active}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="h-full w-full object-cover"
          playsInline
          loop
          // Explicitly NOT muted — language demos need audio
          muted={false}
          preload="auto"
          controls={false}
          onError={() => setFileError(true)}
        />
        {fileError && active && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 px-4 text-center text-xs text-zinc-300">
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
    if (!playSrc) return null;
    return (
      <div
        className={cn(
          "absolute inset-0 z-[1] overflow-hidden bg-black",
          className
        )}
      >
        <iframe
          key={playSrc}
          className="pointer-events-none absolute inset-0 h-full w-full scale-[1.12]"
          src={playSrc}
          title={`Démo — ${languageName}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          tabIndex={-1}
        />
      </div>
    );
  }

  if (videoType === "x") {
    const embed = xEmbedUrl(videoUrl);
    if (!embed) return null;
    return (
      <div
        className={cn(
          "absolute inset-0 z-[1] overflow-hidden bg-black",
          className
        )}
      >
        <iframe
          key={embed}
          className="pointer-events-none absolute left-1/2 top-0 h-[160%] w-[120%] max-w-none -translate-x-1/2 border-0"
          src={embed}
          title={`Post X — ${languageName}`}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          tabIndex={-1}
        />
      </div>
    );
  }

  return null;
});
