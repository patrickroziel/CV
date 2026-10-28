"use client";

import { ExternalLink } from "lucide-react";
import { cn, xPostUrl, xStatusId } from "@/lib/utils";

type XEmbedProps = {
  url: string;
  title?: string;
  className?: string;
  interactive?: boolean;
  active?: boolean;
  poster?: string | null;
};

/**
 * Clean static X post card (no iframe).
 * Reliable, controlled, and consistent with the site design.
 */
export function XEmbed({
  url,
  title = "Post X",
  className,
  poster,
}: XEmbedProps) {
  const id = xStatusId(url);
  const postUrl = xPostUrl(url) ?? url;

  if (!id) {
    return (
      <div className={cn("flex items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/60 p-6 text-center", className)}>
        <p className="text-sm text-zinc-400">Lien X invalide</p>
      </div>
    );
  }

  return (
    <a
      href={postUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group block overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/90 to-black/80 transition-all hover:border-white/20 hover:bg-zinc-900",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
          <span className="text-lg font-bold">𝕏</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-100">{title}</p>
          <p className="text-xs text-zinc-500">Post sur X</p>
        </div>
        <ExternalLink className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-300" />
      </div>

      {poster ? (
        <div className="relative aspect-video bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-zinc-900 to-black px-6 text-center">
          <p className="text-sm leading-relaxed text-zinc-400">
            Voir le post complet sur X
          </p>
        </div>
      )}

      <div className="px-4 py-3 text-xs text-zinc-500">
        Ouvrir sur x.com →
      </div>
    </a>
  );
}
