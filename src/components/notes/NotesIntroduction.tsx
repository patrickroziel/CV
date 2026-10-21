"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Cloud, BriefcaseBusiness, Waves } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { stripHtml } from "@/lib/sanitize-html";
import { getNoteSharePhoto } from "@/lib/notes-preview-image";

export function NotesIntroduction() {
  const { data, l } = usePortfolio();
  const reduceMotion = useReducedMotion();
  const posts = (data.socialPosts ?? [])
    .filter(post => post.visible !== false)
    .sort((a, b) => a.order - b.order)
    .slice(0, 12);
  const featured = posts.find(post => getNoteSharePhoto(post)) ?? posts[0];
  const image = featured ? getNoteSharePhoto(featured) : null;
  const excerpt = featured ? stripHtml(l(featured.description))
    .replace(/\\[\\[MEDIA:[A-Za-z0-9_-]{8,80}\\]\\]/g, "")
    .replace(/\\s+/g, " ").trim().slice(0, 160) : "";
  return <section aria-label="Bienvenue dans Notes" className="mx-auto mb-12 max-w-[1180px] px-3 sm:px-6 lg:px-8">
    <div className="relative isolate overflow-hidden rounded-[1.8rem] border border-cyan-100/15 bg-[#031923]/65 p-6 shadow-[0_24px_100px_-32px_rgba(2,24,32,.75)] backdrop-blur-2xl sm:p-9 lg:p-12">
      <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-cyan-200/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-[16%] h-72 w-72 rounded-full bg-blue-300/10 blur-3xl" />
      <div className="relative grid items-center gap-8 md:grid-cols-[1.16fr_.84fr] md:gap-12">
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }}>
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.29em] text-cyan-100/70"><Waves className="h-4 w-4" /> Un espace à part</span>
          <h1 className="mt-5 text-5xl font-light tracking-[-.065em] text-white sm:text-6xl lg:text-7xl">Notes<span className="text-cyan-200">.</span></h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-200 sm:text-lg">Des réflexions, des souvenirs, des musiques et des images. Un lieu pour raconter, observer et partager ce qui me traverse.</p>
          <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">Vous êtes dans mon univers éditorial. Deux autres espaces permettent de découvrir ce que j’analyse et ce que je réalise.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/air" className="inline-flex items-center gap-2 rounded-full border border-sky-200/25 bg-sky-100/10 px-4 py-2.5 text-xs font-medium text-sky-100 transition hover:bg-sky-100/20"><Cloud className="h-4 w-4" /> Explorer Air <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            <Link href="/work" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-white/10"><BriefcaseBusiness className="h-4 w-4" /> Découvrir Work <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
        </motion.div>
        {featured && <motion.div initial={reduceMotion ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .9, delay: .16 }}>
          <Link href={`/notes/${featured.id}`} aria-label={`Lire : ${l(featured.title)}`} className="group block overflow-hidden rounded-2xl border border-cyan-100/15 bg-black/35">
            <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-cyan-900/45 via-slate-950 to-indigo-950/55">
              {image ? <img src={image} alt="" className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-[1.04]" loading="lazy" /> :
                <div className="flex h-full items-center justify-center text-7xl font-light tracking-tight text-cyan-100/30">N.</div>}
              <div className="absolute inset-0 bg-gradient-to-t from-[#03131a]/80 via-transparent to-transparent" />
              <span className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[.16em] text-white/90 backdrop-blur-md">À découvrir</span>
            </div>
            <div className="flex items-start justify-between gap-3 p-5">
              <div className="min-w-0"><p className="line-clamp-2 text-sm font-medium text-white">{l(featured.title)}</p>
                {excerpt && <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-400">{excerpt}</p>}</div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-cyan-200" />
            </div>
          </Link>
        </motion.div>}
      </div>
      <div className="relative mt-8 flex items-center gap-3 border-t border-cyan-100/10 pt-5 text-[11px] uppercase tracking-[.22em] text-cyan-100/50">
        <ArrowDownRight className="h-4 w-4" /> Explorer les publications
      </div>
    </div>
  </section>;
}
