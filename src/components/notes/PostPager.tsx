"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { SocialPost } from "@/lib/types";

function sortPosts(posts: SocialPost[]) {
  return [...posts].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return (b.date || "").localeCompare(a.date || "");
  });
}

export function PostPager({
  postId,
  universe,
  seedPosts = [],
  tone = "dark",
  placement = "footer",
  extra,
}: {
  postId: string;
  universe: "notes" | "air";
  seedPosts?: SocialPost[];
  tone?: "dark" | "light";
  placement?: "footer" | "pills";
  extra?: ReactNode;
}) {
  const { data, editMode, l, isHydrated } = usePortfolio();
  const posts = useMemo(() => {
    const source = !isHydrated && seedPosts.length ? seedPosts : (data.socialPosts ?? []);
    return sortPosts(source.filter((post) => {
      const inUniverse = universe === "air" ? post.universe === "air" : post.universe !== "air";
      return inUniverse && (editMode || post.visible !== false);
    }));
  }, [data.socialPosts, editMode, isHydrated, seedPosts, universe]);

  const index = posts.findIndex((post) => post.id === postId);
  const previous = index > 0 ? posts[index - 1] : null;
  const next = index >= 0 && index < posts.length - 1 ? posts[index + 1] : null;
  const home = universe === "air" ? "/air" : "/";
  const href = (id: string) => (universe === "air" ? `/air/${id}` : `/notes/${id}`);
  const light = tone === "light";

  const side = light
    ? "border-slate-900/10 bg-white/75 text-slate-800 hover:bg-white"
    : "border-white/10 bg-black/25 text-zinc-200 hover:bg-white/[0.06] hover:text-white";
  const idle = light
    ? "border-slate-900/10 bg-white/40 text-slate-500"
    : "border-white/10 bg-black/15 text-zinc-500";
  const homeClass = light
    ? "border-sky-900/15 bg-white text-slate-950 shadow-sm hover:bg-sky-50"
    : "border-cyan-300/25 bg-cyan-400/10 text-cyan-50 hover:bg-cyan-400/20";

  function label(post: SocialPost) {
    return l(post.title).trim() || "Sans titre";
  }

  function Side({
    post,
    direction,
  }: {
    post: SocialPost | null;
    direction: "previous" | "next";
  }) {
    const forward = direction === "next";
    const caption = forward ? "Suivant" : "Précédent";
    const className = `flex min-h-16 min-w-0 items-center gap-2 rounded-2xl border p-3 text-left transition sm:min-h-[4.5rem] sm:p-4 ${post ? side : `${idle} pointer-events-none`}`;
    const body = (
      <>
        {!forward ? <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden /> : null}
        <span className={`min-w-0 flex-1 ${forward ? "text-right" : ""}`}>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">{caption}</span>
          <span className="mt-1 block line-clamp-2 text-sm font-medium leading-snug">
            {post ? label(post) : "—"}
          </span>
        </span>
        {forward ? <ChevronRight className="h-4 w-4 shrink-0" aria-hidden /> : null}
      </>
    );
    if (!post) return <span className={className} aria-hidden="true">{body}</span>;
    return (
      <Link href={href(post.id)} className={className} aria-label={`${caption} : ${label(post)}`}>
        {body}
      </Link>
    );
  }

  if (placement === "pills") {
    const pill = "inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#071433]/80 px-2.5 text-[11px] leading-none text-white/90 shadow-[0_6px_16px_rgba(2,8,28,0.35)] backdrop-blur-md hover:bg-[#071433]/95 hover:text-white";
    const round = "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#071433]/80 text-white/90 shadow-[0_6px_16px_rgba(2,8,28,0.35)] backdrop-blur-md hover:bg-[#071433]/95 hover:text-white";
    const idleRound = "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-[#071433]/40 text-white/35";
    return (
      <>
        <Link href={home} className={pill}>Air</Link>
        {extra}
        <nav className="no-print flex shrink-0 items-center gap-1.5" aria-label="Navigation entre les publications">
          {previous ? (
            <Link href={href(previous.id)} className={round} aria-label={`Précédent : ${label(previous)}`} title={label(previous)}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <span className={idleRound} aria-hidden="true"><ChevronLeft className="h-4 w-4" /></span>
          )}
          {next ? (
            <Link href={href(next.id)} className={round} aria-label={`Suivant : ${label(next)}`} title={label(next)}>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <span className={idleRound} aria-hidden="true"><ChevronRight className="h-4 w-4" /></span>
          )}
        </nav>
      </>
    );
  }

  return (
    <nav className="no-print mt-6 grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3" aria-label="Navigation entre les publications">
      <Link
        href={home}
        className={`col-span-2 inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:px-5 ${homeClass}`}
      >
        Page principale
      </Link>
      <div className="min-w-0 sm:col-start-1 sm:row-start-1">
        <Side post={previous} direction="previous" />
      </div>
      <div className="min-w-0 sm:col-start-3 sm:row-start-1">
        <Side post={next} direction="next" />
      </div>
    </nav>
  );
}
