"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { cn, xEmbedUrl, xPostUrl, xStatusId } from "@/lib/utils";

type XEmbedProps = {
  url: string;
  title?: string;
  className?: string;
  /** Full interactive tweet (detail page) */
  interactive?: boolean;
  /** Load only when parent says visible (viewport) */
  active?: boolean;
  poster?: string | null;
};

/**
 * Dark-theme X/Twitter post embed.
 * Card mode: clipped 16:9 glass-friendly frame, loads when `active`.
 * Interactive: full-height iframe for detail pages.
 */
export function XEmbed({
  url,
  title = "Post X",
  className,
  interactive = false,
  active = true,
  poster,
}: XEmbedProps) {
  const id = xStatusId(url);
  const embedSrc = xEmbedUrl(url);
  const postUrl = xPostUrl(url) ?? url;
  const [failed, setFailed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!id || !embedSrc) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-2 bg-zinc-900/80 p-4 text-center",
          className
        )}
      >
        <p className="text-sm text-zinc-400">Lien X invalide</p>
      </div>
    );
  }

  if (!active && !interactive) {
    return (
      <div className={cn("relative h-full w-full bg-black", className)}>
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur-md">
              𝕏
            </span>
          </div>
        )}
      </div>
    );
  }

  if (failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-3 bg-zinc-950 p-4 text-center",
          className
        )}
      >
        <span className="text-2xl text-zinc-500">𝕏</span>
        <p className="text-sm text-zinc-400">Impossible de charger l’embed X</p>
        <a
          href={postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-teal-300 hover:underline"
        >
          Ouvrir sur X
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  if (interactive) {
    return (
      <div className={cn("relative h-full min-h-[320px] w-full bg-black", className)}>
        <iframe
          ref={iframeRef}
          key={embedSrc}
          src={embedSrc}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  // Card: fill 16:9, scale embed slightly for a cinematic crop
  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-black", className)}>
      <iframe
        ref={iframeRef}
        key={embedSrc}
        src={embedSrc}
        title={title}
        className="pointer-events-none absolute left-1/2 top-0 h-[180%] w-[115%] max-w-none -translate-x-1/2 border-0"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        tabIndex={-1}
        onError={() => setFailed(true)}
      />
      {/* Soft gradient for glass card cohesion */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
    </div>
  );
}
