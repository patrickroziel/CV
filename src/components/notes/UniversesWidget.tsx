"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { WaterIcon } from "@/components/layout/universe-icons";
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
  const [slideIndex, setSlideIndex] = useState(0);
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

  // Shuffle once on mount / when candidates change
  useEffect(() => {
    if (candidates.length) {
      setShuffled(shuffle(candidates).slice(0, 10));
      setArticleIndex(0);
    } else {
      setShuffled([]);
    }
  }, [candidates]);

  const featured = shuffled[articleIndex % Math.max(shuffled.length, 1)] ?? null;

  const here = {
    notes: { label: "Vous êtes dans Notes", content: "Textes, images, musiques et fragments personnels.", href: "/notes" },
    air: { label: "Vous êtes dans Scope", content: "Décryptages, récits et analyses.", href: "/air" },
    work: { label: "Vous êtes dans Work", content: "Portfolio, parcours et compétences.", href: "/work" },
    lights: { label: "Vous êtes dans Lights", content: "Citations, images et vidéos.", href: "/lights" },
  }[current];
  const elsewhere = [
    { key: "notes" as const, label: "Notes", content: "Textes, images, musiques et fragments personnels.", href: "/notes" },
    { key: "air" as const, label: "Scope", content: "Décryptages, récits et analyses.", href: "/air" },
    { key: "work" as const, label: "Work", content: "Portfolio, parcours et compétences.", href: "/work" },
    { key: "lights" as const, label: "Lights", content: "Citations, images et vidéos.", href: "/lights" },
  ].filter((item) => item.key !== current);
  const slides = [here, ...elsewhere];

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setSlideIndex(current => (current + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [reduceMotion, slides.length]);

  useEffect(() => {
    if (reduceMotion || shuffled.length <= 1) return;
    const timer = window.setInterval(() => {
      setArticleIndex(current => (current + 1) % shuffled.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [reduceMotion, shuffled.length]);

  return (
    <section aria-label="Découvrir les quatre univers" className="mt-3 min-w-0 md:mt-5">
      <div className="relative overflow-hidden rounded-2xl border border-cyan-100/15 bg-[#031c25]/65 p-3.5 shadow-[0_16px_40px_-24px_rgba(0,0,0,.8)] backdrop-blur-xl">
        <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-200/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[.18em] text-cyan-100/70">
            <WaterIcon className="h-3.5 w-3.5" /> Quatre univers
          </span>
          <div className="flex gap-1" aria-label="Étape de présentation">
            {slides.map((slide, step) => (
              <button
                key={slide.label}
                type="button"
                onClick={() => setSlideIndex(step)}
                aria-label={`Afficher ${slide.label}`}
                aria-pressed={step === slideIndex}
                className={`h-1.5 rounded-full transition-all duration-300 ${step === slideIndex ? "w-4 bg-cyan-200" : "w-1.5 bg-white/20 hover:bg-white/40"}`}
              />
            ))}
          </div>
        </div>
        <div className="relative mt-2 hidden min-h-[72px] md:mt-3 md:block">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={slideIndex}
              initial={reduceMotion ? false : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-1.5"
            >
              <p className="text-sm font-semibold tracking-tight text-white">{slides[slideIndex].label}</p>
              <p className="text-[11px] leading-[1.55] text-zinc-300">{slides[slideIndex].content}</p>
              {slideIndex > 0 && (
                <Link href={slides[slideIndex].href} className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-100 hover:underline">
                  Découvrir {slides[slideIndex].label} <ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {featured && (
          <div className="relative mt-2 border-t border-white/10 pt-3">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={featured.id}
                initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.985 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
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
        )}
      </div>
    </section>
  );
}
