"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { stripHtml } from "@/lib/sanitize-html";
import { getNoteSharePhoto } from "@/lib/notes-preview-image";
import { isTeaserPost } from "@/lib/post-publication";
import { isHeldMediaUrl } from "@/lib/blob-upload";
import type { LightNote } from "@/lib/types";

type Current = "notes" | "air" | "work" | "lights";

type Feature = {
  id: string;
  href: string;
  label: string;
  quote: string;
  image: string | null;
};

function lightFeature(note: LightNote): Feature {
  const image = note.thumb || (note.kind === "image" ? note.url : null);
  return {
    id: note.id,
    href: `/lights#${note.id}`,
    label: "À lire dans Lights",
    quote: note.text || "Lights",
    image,
  };
}

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function UniversesWidget({ current = "notes" }: { current?: Current }) {
  const { data, l } = usePortfolio();
  const reduceMotion = useReducedMotion();
  const [articleIndex, setArticleIndex] = useState(0);
  const [shuffled, setShuffled] = useState<Feature[]>([]);

  const candidates = useMemo(() => {
    const posts = (data.socialPosts ?? []).filter(post => post.visible !== false);
    const lights = (data.lightNotes ?? []).filter(note => note.visible !== false);
    const items: Feature[] = [];
    for (const post of posts) {
      const scope = post.universe === "air";
      if (current === "air" && scope) continue;
      if (current === "notes" && !scope) continue;
      const photo = getNoteSharePhoto(post);
      const quote = !isTeaserPost(post)
        ? stripHtml(l(post.description)).replace(/\[\[MEDIA:[A-Za-z0-9_-]{8,80}\]\]/g, "").replace(/\s+/g, " ").trim().slice(0, 105)
        : "";
      items.push({
        id: post.id,
        href: `/${scope ? "air" : "notes"}/${post.id}`,
        label: scope ? "À lire dans Scope" : "À lire dans Notes",
        quote: quote || l(post.title),
        image: photo && !isHeldMediaUrl(photo) ? photo : null,
      });
    }
    if (current !== "lights") {
      for (const note of lights) items.push(lightFeature(note));
    }
    const withImage = items.filter(item => item.image);
    return withImage.length ? withImage : items;
  }, [data.socialPosts, data.lightNotes, current, l]);

  useEffect(() => {
    if (candidates.length) {
      setShuffled(shuffle(candidates).slice(0, 10));
      setArticleIndex(0);
    } else {
      setShuffled([]);
    }
  }, [candidates]);

  const featured = shuffled[articleIndex % Math.max(shuffled.length, 1)] ?? null;

  useEffect(() => {
    if (reduceMotion || shuffled.length <= 1) return;
    const timer = window.setInterval(() => {
      setArticleIndex(current => (current + 1) % shuffled.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [reduceMotion, shuffled.length]);

  if (!featured) return null;

  return (
    <section aria-label="À lire ailleurs" className="mt-3 min-w-0 md:mt-5">
      <div className="relative overflow-hidden rounded-2xl border border-cyan-100/15 bg-[#031c25]/65 p-3.5 shadow-[0_16px_40px_-24px_rgba(0,0,0,.8)] backdrop-blur-xl">
        <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-200/10 blur-2xl" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={featured.id}
            initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.985 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <Link
              href={featured.href}
              className="group flex min-w-0 items-center gap-2.5"
              title="Lire une publication"
            >
              {featured.image ? (
                <img
                  src={featured.image}
                  alt=""
                  loading="lazy"
                  className="h-12 w-14 shrink-0 rounded-lg object-cover"
                />
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block text-[9px] uppercase tracking-[.14em] text-cyan-100/50">{featured.label}</span>
                <span className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-zinc-200 group-hover:text-cyan-100">
                  {featured.quote}
                </span>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-cyan-100/60" aria-hidden />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
