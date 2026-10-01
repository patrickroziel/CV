"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, EyeOff, FileDown, Pencil, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { RichHtml } from "@/components/shared/RichHtml";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { NotesCategory, SocialPost } from "@/lib/types";
import { stripHtml } from "@/lib/sanitize-html";
import { cn, isYoutubeUrl, youtubeEmbedUrl, youtubeThumb } from "@/lib/utils";

function formatSocialDate(iso: string): string {
  const raw = iso.length === 10 ? `${iso}T12:00:00` : iso;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function excerptFromHtml(html: string, max = 260): string {
  const text = stripHtml(html).replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

type SocialPostCardProps = {
  post: SocialPost;
  index: number;
  onEdit: (post: SocialPost) => void;
  onTagClick?: (tag: string) => void;
};

function Tags({ post, onTagClick }: { post: SocialPost; onTagClick?: (tag: string) => void }) {
  if (!post.tags?.length) return null;
  return (
    <ul className="flex min-w-0 flex-wrap gap-1.5">
      {post.tags.map((tag) => (
        <li key={tag} className="min-w-0">
          <button
            type="button"
            onClick={() => onTagClick?.(tag)}
            className="max-w-full break-words rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-0.5 text-left text-[11px] font-medium text-cyan-50 transition hover:bg-cyan-400/20"
          >
            {tag}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function SocialPostCard({ post, index, onEdit, onTagClick }: SocialPostCardProps) {
  const { l, t, editMode, removeSocialPost } = usePortfolio();

  const rawTitle = l(post.title).trim();
  const title = rawTitle || (editMode && !post.visible ? "Brouillon sans titre" : "");
  const subtitle = post.subtitle ? l(post.subtitle) : "";
  const description = l(post.description);
  const yt = post.youtubeUrl?.trim() || "";
  const embed = yt && isYoutubeUrl(yt) ? youtubeEmbedUrl(yt) : null;
  const thumb = yt && isYoutubeUrl(yt) ? youtubeThumb(yt) : null;
  const category: NotesCategory =
    post.category ??
    (yt
      ? "Vidéos"
      : post.fileKind === "image"
        ? "Images"
        : post.fileKind === "pdf"
          ? "Documents"
          : "Réflexions");

  const editButtons = editMode ? (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-zinc-400"
        title="Modifier"
        onClick={() => onEdit(post)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-400"
        title="Supprimer"
        onClick={() => {
          if (confirm("Supprimer cette publication ?")) removeSocialPost(post.id);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  ) : null;

  if (category === "Livre") {
    const excerpt = excerptFromHtml(description);
    return (
      <motion.article
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2) }}
        className="min-w-0"
      >
        <GlassCard
          glow
          className={cn(
            "min-w-0 overflow-hidden p-0 ring-1 ring-cyan-300/10",
            !post.visible && "opacity-70"
          )}
        >
          {post.bookCoverUrl ? (
            <div className="relative aspect-[16/8] w-full overflow-hidden border-b border-white/10 bg-black/40 sm:aspect-[16/7]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.bookCoverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            </div>
          ) : null}

          <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-6">
            <header className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-100/15 bg-cyan-100/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100/75">
                    <BookOpen className="h-3 w-3" />
                    Livre
                  </span>
                  <time dateTime={post.date} className="text-[11px] font-medium text-zinc-500">
                    {formatSocialDate(post.date)}
                  </time>
                  {editMode && !post.visible && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                      <EyeOff className="h-3 w-3" /> Brouillon
                    </span>
                  )}
                </div>
                <h3 className="break-words text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">
                  {title}
                </h3>
                {subtitle ? (
                  <p className="mt-1 break-words text-sm leading-6 text-zinc-400">{subtitle}</p>
                ) : null}
              </div>
              {editButtons}
            </header>

            {excerpt ? (
              <p className="max-w-full break-words text-sm leading-6 text-zinc-400">{excerpt}</p>
            ) : null}

            <Tags post={post} onTagClick={onTagClick} />

            <div className="flex min-w-0 flex-col gap-2 border-t border-white/[0.07] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={`/notes/${post.id}`}
                className="inline-flex w-fit items-center rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3.5 py-2 text-sm font-medium text-cyan-50 transition hover:bg-cyan-400/20"
              >
                Lire le chapitre →
              </Link>
              {post.bookPdfUrl ? (
                <a
                  href={post.bookPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 text-xs font-medium text-zinc-500 transition hover:text-zinc-200"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Télécharger le PDF
                </a>
              ) : null}
            </div>
          </div>
        </GlassCard>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2) }}
      className="min-w-0"
    >
      <GlassCard
        glow
        className={cn(
          "min-w-0 overflow-hidden p-0 ring-1 ring-cyan-300/10",
          !post.visible && "opacity-70"
        )}
      >
        <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-6">
          <header className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-100/15 bg-cyan-100/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-100/75">
                  {category}
                </span>
                <time dateTime={post.date} className="text-[11px] font-medium text-zinc-500">
                  {formatSocialDate(post.date)}
                </time>
                {editMode && !post.visible && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                    <EyeOff className="h-3 w-3" /> Brouillon
                  </span>
                )}
              </div>
              <h3 className="break-words text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">
                {title}
              </h3>
            </div>
            {editButtons}
          </header>

          {description ? (
            <RichHtml
              html={description}
              className="min-w-0 max-w-full overflow-hidden text-sm leading-6 text-zinc-400 [&_*]:max-w-full [&_a]:break-all"
            />
          ) : null}

          <Tags post={post} onTagClick={onTagClick} />

          {embed && (
            <div className="relative max-w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-inner">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-40"
                  aria-hidden
                />
              ) : null}
              <div className="relative aspect-video w-full min-w-0">
                <iframe
                  src={embed}
                  title={title || t("medias.youtubeLabel")}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {post.fileUrl && post.fileKind === "image" && (
            <div className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.fileUrl}
                alt={title}
                className="max-h-[480px] h-auto w-full object-contain"
              />
            </div>
          )}

          {post.fileUrl && post.fileKind === "pdf" && (
            <a
              href={post.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full w-fit items-center gap-2 break-words rounded-full border border-cyan-300/30 bg-cyan-400/15 px-3.5 py-2 text-sm font-medium text-cyan-50 transition hover:bg-cyan-400/25"
            >
              <FileDown className="h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">{post.fileName?.trim() || t("medias.downloadPdf")}</span>
            </a>
          )}
        </div>
      </GlassCard>
    </motion.article>
  );
}
