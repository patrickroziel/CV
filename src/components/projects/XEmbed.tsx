"use client";

import { useEffect, useState } from "react";
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

type FxTweet = {
  author?: { name?: string; screen_name?: string; avatar_url?: string };
  media?: { photos?: { url: string }[] };
  text?: string;
};

/**
 * Clean X post card that auto-fetches public content (image + author) via fxtwitter.
 * Just paste the X URL — no manual HTML needed.
 */
export function XEmbed({
  url,
  title = "Post X",
  className,
  poster,
}: XEmbedProps) {
  const id = xStatusId(url);
  const postUrl = xPostUrl(url) ?? url;
  const [data, setData] = useState<FxTweet | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    fetch(`https://api.fxtwitter.com/status/${id}`)
      .then(r => r.json())
      .then(json => {
        if (!cancelled && json?.tweet) setData(json.tweet);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (!id) {
    return (
      <div className={cn("flex items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/60 p-6 text-center", className)}>
        <p className="text-sm text-zinc-400">Lien X invalide</p>
      </div>
    );
  }

  const authorName = data?.author?.name || title;
  const authorHandle = data?.author?.screen_name;
  const avatar = data?.author?.avatar_url;
  const image = poster || data?.media?.photos?.[0]?.url;

  return (
    <a
      href={postUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group block w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 transition-all hover:border-white/20",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
        {avatar ? (
          <img src={avatar} alt="" className="h-9 w-9 rounded-full" />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white">
            <span className="text-base font-bold">𝕏</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-100">{authorName}</p>
          <p className="text-xs text-zinc-500">{authorHandle ? `@${authorHandle}` : "Post sur X"}</p>
        </div>
        <ExternalLink className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-300" />
      </div>

      {image ? (
        <div className="relative bg-black">
          <img src={image} alt="" className="w-full object-cover" />
        </div>
      ) : (
        <div className="flex min-h-[160px] items-center justify-center bg-zinc-900 px-6 py-10 text-center">
          <p className="text-sm leading-relaxed text-zinc-400">
            {loading ? "Chargement…" : "Voir le post complet sur X"}
          </p>
        </div>
      )}

      <div className="px-4 py-3 text-xs text-zinc-500 group-hover:text-zinc-400">
        Ouvrir sur x.com →
      </div>
    </a>
  );
}
