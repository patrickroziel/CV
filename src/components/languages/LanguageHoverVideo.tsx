"use client";

import { useEffect, useRef, useState } from "react";
import type { LanguageVideoType } from "@/lib/types";
import { cn, youtubeEmbedUrl, xEmbedUrl } from "@/lib/utils";

type LanguageHoverVideoProps = {
  videoType: LanguageVideoType;
  videoUrl: string | null;
  languageName: string;
  className?: string;
  /** Only when true: video is mounted and playing (hover) */
  active: boolean;
};

/**
 * Demo video — mounted only while the card is hovered.
 * Never visible at rest.
 */
export function LanguageHoverVideo({
  videoType,
  videoUrl,
  languageName,
  className,
  active,
}: LanguageHoverVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fileError, setFileError] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || videoType !== "file" || !active) return;
    el.muted = false;
    el.currentTime = 0;
    void el.play().catch(() => {
      el.muted = true;
      void el.play().catch(() => setFileError(true));
    });
    return () => {
      el.pause();
    };
  }, [active, videoType, videoUrl]);

  if (!active || videoType === "none" || !videoUrl) return null;

  // —— File ——
  if (videoType === "file") {
    return (
      <div
        className={cn(
          "absolute inset-0 z-[1] overflow-hidden bg-black/90",
          className
        )}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="h-full w-full object-cover"
          playsInline
          loop
          preload="metadata"
          onError={() => setFileError(true)}
        />
        {fileError && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400">
            Lecture impossible
          </div>
        )}
      </div>
    );
  }

  // —— YouTube ——
  if (videoType === "youtube") {
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

  // —— X ——
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
}
