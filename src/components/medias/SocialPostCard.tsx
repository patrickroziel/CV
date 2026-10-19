"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, EyeOff, FileDown, Pencil, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { PostRichBody } from "@/components/medias/PostRichBody";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { FeaturedMedia } from "@/components/medias/FeaturedMedia";
import { PostActions } from "@/components/medias/PostActions";
import type { NotesCategory, SocialPost, FeaturedEmbed } from "@/lib/types";
import { stripHtml } from "@/lib/sanitize-html";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  const value = new Date(iso.length === 10 ? iso + "T12:00:00" : iso);
  return Number.isNaN(value.getTime()) ? iso : value.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
function excerpt(html: string) {
  const text = stripHtml(html).replace(/\[\[MEDIA:[a-zA-Z0-9_-]{8,80}\]\]/g, "").replace(/\s+/g, " ").trim();
  return text.length > 260 ? text.slice(0, 260).trimEnd() + "…" : text;
}
export function SocialPostCard({ post, index, onEdit, onTagClick }: {
  post: SocialPost;
  index: number;
  onEdit: (post: SocialPost) => void;
  onTagClick?: (tag: string) => void;
}) {
  const { l, editMode, removeSocialPost } = usePortfolio();
  const title = l(post.title).trim() || (editMode && !post.visible ? "Brouillon sans titre" : "");
  const description = l(post.description);
  const isBook = post.category === "Livre";
  const category: NotesCategory = post.category ?? (post.youtubeUrl ? "Vidéos" : post.fileKind === "image" ? "Images" : post.fileKind === "pdf" ? "Documents" : "Réflexions");
  const featured: FeaturedEmbed | null = post.featuredEmbed ?? (post.youtubeUrl ? { type: "youtube", url: post.youtubeUrl } : null);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2) }}
      className="min-w-0"
    >
      <GlassCard glow className={cn("min-w-0 overflow-hidden p-0 ring-1 ring-cyan-300/10", !post.visible && "opacity-70")}>
        {post.bookCoverUrl && (
          <div className="relative aspect-[16/8] w-full overflow-hidden border-b border-white/10 bg-black/40 sm:aspect-[16/7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.bookCoverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-6">
          <header className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-100/15 bg-cyan-100/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100/75">
                  {isBook && <BookOpen className="h-3 w-3" />} {category}
                </span>
                <time dateTime={post.date} className="text-[11px] font-medium text-zinc-500">{formatDate(post.date)}</time>
                {editMode && !post.visible && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-100">
                    <EyeOff className="h-3 w-3" /> Brouillon
                  </span>
                )}
              </div>
              <h3 className="break-words text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">
                <Link href={`/notes/${post.id}`} className="hover:text-cyan-100">{title}</Link>
              </h3>
              {post.subtitle && <p className="mt-1 break-words text-sm leading-6 text-zinc-400">{l(post.subtitle)}</p>}
            </div>
            {editMode && <div className="flex shrink-0 items-center gap-1">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400" title="Modifier" onClick={() => onEdit(post)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-400" title="Supprimer" onClick={() => {
                if (window.confirm("Supprimer cette publication ?")) removeSocialPost(post.id);
              }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>}
          </header>

          {!isBook && featured && <FeaturedMedia media={featured} title={title} />}
          {!isBook && post.fileKind === "image" && post.fileUrl && post.fileUrl !== post.bookCoverUrl &&
            post.fileUrl !== featured?.url && <div className="relative aspect-video w-full max-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.fileUrl} alt={title} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-center" />
            </div>
          }

          {description ? isBook ? (
            <p className="break-words text-sm leading-6 text-zinc-400">{excerpt(description)}</p>
          ) : (
            <PostRichBody html={description} inlineMedia={post.inlineMedia} title={title} className="min-w-0 max-w-full overflow-hidden text-sm leading-6 text-zinc-300 [&_*]:max-w-full [&_a]:break-all" />
          ) : null}

          {post.tags?.length ? <ul className="flex min-w-0 flex-wrap gap-1.5">
            {post.tags.map(tag => <li key={tag}><button type="button" onClick={() => onTagClick?.(tag)}
              className="break-words rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-0.5 text-left text-[11px] font-medium text-cyan-50 hover:bg-cyan-400/20">{tag}</button></li>)}
          </ul> : null}

          {post.fileKind === "pdf" && post.fileUrl && <a href={post.fileUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 break-words rounded-full border border-cyan-300/30 bg-cyan-400/15 px-3.5 py-2 text-sm font-medium text-cyan-50 hover:bg-cyan-400/25">
            <FileDown className="h-4 w-4" />{post.fileName || "Télécharger le document"}
          </a>}

          {isBook && post.bookPdfUrl && <a href={post.bookPdfUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-200">
            <FileDown className="h-4 w-4" /> Télécharger le chapitre en PDF
          </a>}

          <div className="flex flex-col gap-3">
            <Link href={`/notes/${post.id}`} className="inline-flex w-fit items-center rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3.5 py-2 text-sm font-medium text-cyan-50 hover:bg-cyan-400/20">
              {isBook ? "Lire le chapitre" : "Ouvrir le post"} →
            </Link>
            <PostActions postId={post.id} title={title} visible={post.visible !== false} />
          </div>
        </div>
      </GlassCard>
    </motion.article>
  );
}
