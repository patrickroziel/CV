"use client";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import type { FeaturedEmbed } from "@/lib/types";
import { normalizeFeaturedEmbed } from "@/lib/featured-embed";
import { XEmbed } from "@/components/projects/XEmbed";

function ViewportYouTube({ id, title, autoplay }: {
  id: string;
  title: string;
  autoplay: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [visibleRatio, setVisibleRatio] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      setVisibleRatio(1);
      return;
    }
    const observer = new IntersectionObserver(
      entries => setVisibleRatio(entries[0]?.intersectionRatio ?? 0),
      { threshold: [0, 0.01, 0.6, 1] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduceMotion(motion.matches);
    updateMotion();
    motion.addEventListener("change", updateMotion);
    return () => motion.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => {
    if (autoplay && !reduceMotion && visibleRatio >= 0.6) setStarted(true);
  }, [autoplay, reduceMotion, visibleRatio]);

  return (
    <div ref={host} className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
      {started ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1&autoplay=1&mute=1&controls=1`}
          title={title || "Vidéo YouTube"}
          className="absolute inset-0 h-full w-full border-0"
          loading="eager"
          allow="autoplay; accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setStarted(true)}
          aria-label="Lire la vidéo YouTube sans le son"
          className="group absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden bg-black text-white"
        >
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <span className="relative flex h-14 w-20 items-center justify-center rounded-2xl bg-red-600 shadow-xl transition-transform group-hover:scale-105">
            <Play className="h-7 w-7 fill-white" aria-hidden="true" />
          </span>
          <span className="sr-only">Vidéo silencieuse au démarrage, son activable dans le lecteur</span>
        </button>
      )}
    </div>
  );
}

export function FeaturedMedia({ media, title, autoplay = true }: {
  media: FeaturedEmbed | null | undefined;
  title: string;
  autoplay?: boolean;
}) {
  const featured = normalizeFeaturedEmbed(media);
  if (!featured) return null;

  if (featured.type === "image") {
    return <div className="relative aspect-video w-full max-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
      <img src={featured.url} alt={title || "Image intégrée"} loading="lazy" referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover object-center" />
    </div>;
  }
  if (featured.type === "x") {
    return (
      <div className="w-full">
        <XEmbed url={featured.url} title={title || "Post X"} />
      </div>
    );
  }
  const id = new URL(featured.url).searchParams.get("v");
  return id ? <ViewportYouTube key={id} id={id} title={title} autoplay={autoplay} /> : null;
}
