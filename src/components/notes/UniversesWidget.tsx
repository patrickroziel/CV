"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, Cloud, Radio, Waves } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { stripHtml } from "@/lib/sanitize-html";
import { getNoteSharePhoto } from "@/lib/notes-preview-image";
import type { SocialPost } from "@/lib/types";

type Current = "notes" | "air";

function pickFeatured(posts: SocialPost[]) {
  return posts.find(post => getNoteSharePhoto(post)) ?? posts[0] ?? null;
}

export function UniversesWidget({ current = "notes" }: { current?: Current }) {
  const { data, l } = usePortfolio();
  const reduceMotion = useReducedMotion();
  const [slideIndex, setSlideIndex] = useState(0);
  const [articleIndex, setArticleIndex] = useState(0);

  const candidates = useMemo(() => {
    const all = (data.socialPosts ?? [])
      .filter(post => post.visible !== false)
      .sort((a, b) => a.order - b.order);

    const notes = all.filter(p => p.universe !== "air");
    const air = all.filter(p => p.universe === "air");

    // Prefer posts with images, mix Notes + Air
    const withImage = [...notes, ...air].filter(p => getNoteSharePhoto(p));
    const pool = withImage.length ? withImage : [...notes, ...air];
    return pool.slice(0, 8);
  }, [data.socialPosts]);

  const featured = candidates[articleIndex % Math.max(candidates.length, 1)] ?? null;

  const slides = current === "air"
    ? [
        { label: "Vous êtes dans Air", content: "Décryptages, expériences et observations.", href: "/air" },
        { label: "Notes", content: "Textes, images, musiques et fragments personnels.", href: "/notes" },
        { label: "Work", content: "Portfolio · CV · Compétences", href: "/work" },
      ]
    : [
        { label: "Vous êtes dans Notes", content: "Textes, images, musiques et fragments personnels.", href: "/notes" },
        { label: "Air", content: "Décryptages · Expériences · Observations", href: "/air" },
        { label: "Work", content: "Portfolio · CV · Compétences", href: "/work" },
      ];

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setSlideIndex(current => (current + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [reduceMotion, slides.length]);

  useEffect(() => {
    if (reduceMotion || candidates.length <= 1) return;
    const timer = window.setInterval(() => {
      setArticleIndex(current => (current + 1) % candidates.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [reduceMotion, candidates.length]);

  const image = featured ? getNoteSharePhoto(featured) : null;
  const quote = featured
    ? stripHtml(l(featured.description))
        .replace(/\[\[MEDIA:[A-Za-z0-9_-]{8,80}\]\]/g, "")
        .replace(/\s+/g, " ")
        .trim().slice(0, 105)
    : "";
  const isAirArticle = featured?.universe === "air";
  const articleHref = featured
    ? `/${isAirArticle ? "air" : "notes"}/${featured.id}`
    : null;
  const articleLabel = isAirArticle ? "À lire dans Air" : "À lire dans Notes";

  return (
    <section aria-label="Découvrir les trois univers" className="mt-5 min-w-0">
      <div className="relative overflow-hidden rounded-2xl border border-cyan-100/15 bg-[#031c25]/65 p-3.5 shadow-[0_16px_40px_-24px_rgba(0,0,0,.8)] backdrop-blur-xl">
        <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-200/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[.18em] text-cyan-100/70">
            <Waves className="h-3.5 w-3.5" /> Trois univers
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
        <div className="relative mt-3 min-h-[72px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={slideIndex}
              initial={reduceMotion ? false : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
              transition={{ duration: 0.4 }}
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

        {featured && articleHref && (
          <Link
            href={articleHref}
            className="group relative mt-2 flex min-w-0 items-center gap-2.5 border-t border-white/10 pt-3"
            title="Lire une publication"
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" loading="lazy" className="h-12 w-14 shrink-0 rounded-lg object-cover" />
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="block text-[9px] uppercase tracking-[.14em] text-cyan-100/50">{articleLabel}</span>
              <span className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-zinc-200 group-hover:text-cyan-100">
                {quote || l(featured.title)}
              </span>
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-cyan-100/60" aria-hidden />
          </Link>
        )}

        <div className="relative mt-3 flex flex-wrap gap-1.5">
          {current !== "notes" && (
            <Link href="/notes" className="inline-flex items-center gap-1 rounded-full border border-cyan-100/20 bg-cyan-100/[.07] px-2.5 py-1.5 text-[10px] text-cyan-100 transition-colors hover:bg-cyan-100/15">
              <Radio className="h-3 w-3" /> Notes
            </Link>
          )}
          {current !== "air" && (
            <Link href="/air" className="inline-flex items-center gap-1 rounded-full border border-sky-100/20 bg-sky-100/[.07] px-2.5 py-1.5 text-[10px] text-sky-100 transition-colors hover:bg-sky-100/15">
              <Cloud className="h-3 w-3" /> Air
            </Link>
          )}
          <Link href="/work" className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[.05] px-2.5 py-1.5 text-[10px] text-zinc-100 transition-colors hover:bg-white/10">
            <BriefcaseBusiness className="h-3 w-3" /> Work
          </Link>
        </div>
      </div>
    </section>
  );
}
