"use client";
import type { FeaturedEmbed } from "@/lib/types";
import { normalizeFeaturedEmbed } from "@/lib/featured-embed";
import { XEmbed } from "@/components/projects/XEmbed";

export function FeaturedMedia({ media, title }: { media: FeaturedEmbed | null | undefined; title: string }) {
  const featured = normalizeFeaturedEmbed(media);
  if (!featured) return null;
  if (featured.type === "image") {
    return <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={featured.url} alt={title || "Image intégrée"} loading="lazy" referrerPolicy="no-referrer"
        className="max-h-[520px] w-full object-contain" />
    </div>;
  }
  if (featured.type === "x") {
    return <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/50">
      <XEmbed url={featured.url} interactive title={title || "Post X intégré"} />
    </div>;
  }
  const id = new URL(featured.url).searchParams.get("v");
  if (!id) return null;
  return <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
    <iframe src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`}
      className="absolute inset-0 h-full w-full border-0" title={title || "Vidéo YouTube intégrée"}
      loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
  </div>;
}
