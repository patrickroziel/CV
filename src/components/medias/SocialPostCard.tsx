"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, EyeOff, FileDown, Pencil, Pin, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { PostRichBody } from "@/components/medias/PostRichBody";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { FeaturedMedia } from "@/components/medias/FeaturedMedia";
import { PostCover } from "@/components/media/PostCover";
import { PostActions } from "@/components/medias/PostActions";
import { notePartAnchor, notePartTitles } from "@/components/medias/ArticlePartNav";
import type { SocialPost, FeaturedEmbed } from "@/lib/types";
import { coercePostCategory } from "@/lib/post-taxonomy";
import { isTeaserPost, TEASER_LABEL, TEASER_PUBLIC_LINE } from "@/lib/post-publication";
import { displayImageUrl } from "@/lib/display-image";
import { cn } from "@/lib/utils";

function PostPreview({ html, title, inlineMedia }: { html: string; title: string; inlineMedia?: SocialPost["inlineMedia"] }) {
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    setOverflows(el.scrollHeight > el.clientHeight + 12);
  }, [html, open]);
  return (
    <div>
      <div ref={ref} className={open ? undefined : `notes-preview-clamp text-sm${overflows ? " is-faded" : ""}`}>
        <PostRichBody html={html} inlineMedia={inlineMedia} title={title} className="min-w-0 max-w-full overflow-hidden text-sm text-zinc-100 [&_*]:max-w-full [&_a]:break-all" />
      </div>
      {!open && overflows ? (
        <button type="button" onClick={() => setOpen(true)} className="mt-3 text-sm font-medium text-cyan-100 hover:text-white">
          Lire plus...
        </button>
      ) : null}
    </div>
  );
}

function NoteCardParts({ postId, html }: { postId: string; html: string }) {
  const parts = notePartTitles(html);
  if (!parts.length) return null;
  return (
    <div className="air-card-parts !mt-0">
      {parts.map((part, order) => {
        const n = part.index + 1;
        const href = `/notes/${postId}#${notePartAnchor(postId, part.index)}`;
        if (order < 2) {
          return (
            <Link key={part.index} href={href} className="air-card-part" title={`Partie ${n}. ${part.label}`}>
              <span className="air-part-num">{n}</span>
              <span className="air-card-part-name">{part.label}</span>
            </Link>
          );
        }
        return (
          <Link key={part.index} href={href} className="air-card-dot" title={`Partie ${n}. ${part.label}`} aria-label={`Partie ${n}. ${part.label}`}>
            {n}
          </Link>
        );
      })}
    </div>
  );
}

function formatDate(iso: string) {
  const value = new Date(iso.length === 10 ? iso + "T12:00:00" : iso);
  return Number.isNaN(value.getTime()) ? iso : value.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
export function SocialPostCard({ post, index, onEdit, onTagClick }: {
  post: SocialPost;
  index: number;
  onEdit: (post: SocialPost) => void;
  onTagClick?: (tag: string) => void;
}) {
  const { l, editMode, removeSocialPost, updateSocialPost, data } = usePortfolio();
  const title = l(post.title).trim() || (editMode && !post.visible ? "Brouillon sans titre" : "");
  const description = l(post.description);
  const category = coercePostCategory(post);
  const isBook = category === "Livre";
  const teaser = isTeaserPost(post);
  const featured: FeaturedEmbed | null = teaser ? null : (post.featuredEmbed ?? (post.youtubeUrl ? { type: "youtube", url: post.youtubeUrl } : null));

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2) }}
      className="min-w-0"
    >
      <GlassCard glow className={cn("min-w-0 overflow-hidden p-0 ring-1 ring-cyan-300/10", !post.visible && "opacity-70")}>
        <PostCover post={post} />
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
                {teaser && (
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.04em] text-zinc-100">
                    {TEASER_LABEL}
                  </span>
                )}
              </div>
              <h3 className="break-words text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">
                <Link href={`/notes/${post.id}`} className="hover:text-cyan-100">{title}</Link>
              </h3>
              {post.subtitle && <p className="mt-1 break-words text-sm leading-6 text-zinc-400">{l(post.subtitle)}</p>}
            </div>
            {editMode && <div className="flex shrink-0 items-center gap-1">
              <Button type="button" variant="ghost" size="icon" className={cn("h-8 w-8", post.pinned ? "text-cyan-100" : "text-zinc-400")} title={post.pinned ? "Retirer l'épingle" : "Épingler"} onClick={() => {
                if (post.pinned) {
                  updateSocialPost(post.id, { pinned: false, pinnedAt: null });
                  return;
                }
                const pinnedCount = (data.socialPosts ?? []).filter((item) => item.universe !== "air" && item.pinned && item.id !== post.id).length;
                if (pinnedCount >= 6) {
                  window.alert("Six posts sont déjà épinglés.");
                  return;
                }
                updateSocialPost(post.id, { pinned: true, pinnedAt: new Date().toISOString() });
              }}>
                <Pin className="h-4 w-4" />
              </Button>
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

          {!teaser ? <NoteCardParts postId={post.id} html={description} /> : null}

          {!teaser && !isBook && featured && <FeaturedMedia media={featured} title={title} />}
          {!teaser && !isBook && post.fileKind === "image" && post.fileUrl && post.fileUrl !== post.bookCoverUrl &&
            post.fileUrl !== featured?.url && <div className="relative aspect-video w-full max-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={displayImageUrl(post.fileUrl, 1200)} alt={title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-center" />
            </div>
          }

          {teaser ? (
            <p className="text-sm leading-7 text-zinc-400">{TEASER_PUBLIC_LINE}</p>
          ) : description ? (
            <PostPreview html={description} title={title} inlineMedia={isBook ? undefined : post.inlineMedia} />
          ) : null}

          {post.tags?.length ? <ul className="flex min-w-0 flex-wrap gap-1.5">
            {post.tags.map(tag => <li key={tag}><button type="button" onClick={() => onTagClick?.(tag)}
              className="break-words rounded-full border border-white/10 px-2 py-0.5 text-left text-[11px] text-white/55 hover:text-white">{tag}</button></li>)}
          </ul> : null}

          {!teaser && post.fileKind === "pdf" && post.fileUrl && <a href={post.fileUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 break-words text-xs text-white/60 hover:text-white">
            <FileDown className="h-3.5 w-3.5" />{post.fileName || "Télécharger le document"}
          </a>}

          {!teaser && isBook && post.bookPdfUrl && <a href={post.bookPdfUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 text-xs text-white/55 hover:text-white">
            <FileDown className="h-3.5 w-3.5" /> Télécharger le chapitre
          </a>}

          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
            <PostActions postId={post.id} title={title} visible={post.visible !== false} card />
            <Link href={`/notes/${post.id}`} className="text-[13px] font-medium text-white/80 hover:text-white">
              {isBook ? "Lire" : "Ouvrir"}
            </Link>
          </div>
        </div>
      </GlassCard>
    </motion.article>
  );
}
