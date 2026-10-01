"use client";

import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, FileDown } from "lucide-react";
import { useMemo } from "react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { RichHtml } from "@/components/shared/RichHtml";
import type { SocialPost } from "@/lib/types";

function sortBookPosts(posts: SocialPost[]) {
  return [...posts]
    .filter((post) => post.category === "Livre")
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return (b.date || "").localeCompare(a.date || "");
    });
}

function formatDate(iso: string) {
  const raw = iso.length === 10 ? `${iso}T12:00:00` : iso;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function BookReader({ id }: { id: string }) {
  const { data, editMode, l, isHydrated } = usePortfolio();

  const books = useMemo(
    () => sortBookPosts(data.socialPosts ?? []).filter((post) => editMode || post.visible !== false),
    [data.socialPosts, editMode]
  );
  const index = books.findIndex((post) => post.id === id);
  const post = index >= 0 ? books[index] : null;
  const previous = index > 0 ? books[index - 1] : null;
  const next = index >= 0 && index < books.length - 1 ? books[index + 1] : null;

  if (!isHydrated) {
    return <div className="mx-auto h-40 max-w-3xl animate-pulse rounded-3xl border border-white/5 bg-white/[0.025]" />;
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-3 sm:px-6">
        <Link href="/notes" className="inline-flex items-center gap-2 text-sm text-cyan-100/70 hover:text-cyan-50">
          <ArrowLeft className="h-4 w-4" /> Retour à Notes
        </Link>
        <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-6 text-center backdrop-blur-xl sm:p-10">
          <p className="text-sm text-zinc-400">Ce chapitre n’est pas disponible.</p>
        </div>
      </div>
    );
  }

  const title = l(post.title).trim() || (editMode && !post.visible ? "Brouillon sans titre" : "");
  const subtitle = post.subtitle ? l(post.subtitle) : "";
  const body = l(post.description);

  return (
    <div className="mx-auto min-w-0 max-w-3xl px-3 sm:px-6">
      <Link
        href="/notes"
        className="inline-flex items-center gap-2 text-sm text-cyan-100/65 transition hover:text-cyan-50"
      >
        <ArrowLeft className="h-4 w-4" /> Retour à Notes
      </Link>

      <article className="mt-6 min-w-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[rgba(3,16,20,0.72)] shadow-2xl backdrop-blur-2xl sm:rounded-[2rem]">
        {post.bookCoverUrl ? (
          <div className="relative aspect-[16/8] w-full overflow-hidden border-b border-white/10 bg-black/30 sm:aspect-[16/7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.bookCoverUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#031014]/70 via-transparent to-transparent" />
          </div>
        ) : null}

        <div className="min-w-0 p-4 sm:p-8 md:p-10">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-cyan-100/50">
            <span>Livre</span>
            <span aria-hidden>·</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </div>

          <h1 className="mt-4 max-w-full break-words text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-zinc-400 sm:text-base sm:leading-7">
              {subtitle}
            </p>
          ) : null}

          {post.tags?.length ? (
            <div className="mt-5 flex min-w-0 flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href="/notes"
                  className="max-w-full break-words rounded-full border border-cyan-300/15 bg-cyan-400/[0.07] px-2.5 py-1 text-[11px] text-cyan-50/80"
                >
                  {tag}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="my-7 h-px bg-white/[0.07] sm:my-9" />

          <RichHtml
            html={body}
            className="book-reading-text min-w-0 max-w-full overflow-hidden text-[15px] leading-7 text-zinc-200 sm:text-base sm:leading-7 [&_*]:max-w-full [&_a]:break-all"
          />

          {post.bookPdfUrl ? (
            <div className="mt-9 border-t border-white/[0.07] pt-6">
              <a
                href={post.bookPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:bg-cyan-400/20"
              >
                <FileDown className="h-4 w-4 shrink-0" />
                <span className="min-w-0 break-words">{post.bookPdfName?.trim() || "Télécharger le chapitre en PDF"}</span>
              </a>
            </div>
          ) : null}
        </div>
      </article>

      <nav className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2" aria-label="Navigation entre les chapitres">
        <div>
          {previous ? (
            <Link
              href={`/notes/${previous.id}`}
              className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300 transition hover:bg-white/[0.04] hover:text-white"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">{l(previous.title).trim() || "Brouillon sans titre"}</span>
            </Link>
          ) : null}
        </div>
        <div>
          {next ? (
            <Link
              href={`/notes/${next.id}`}
              className="flex min-w-0 items-center justify-end gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-right text-sm text-zinc-300 transition hover:bg-white/[0.04] hover:text-white"
            >
              <span className="min-w-0 break-words">{l(next.title).trim() || "Brouillon sans titre"}</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </Link>
          ) : null}
        </div>
      </nav>
    </div>
  );
}
