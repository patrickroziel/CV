"use client";

import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  FileDown,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RichHtml } from "@/components/shared/RichHtml";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { Locale } from "@/i18n/locales";
import type { NotesCategory, SocialPost } from "@/lib/types";
import { cn, isYoutubeUrl, youtubeEmbedUrl, youtubeThumb } from "@/lib/utils";

function formatSocialDate(iso: string, locale: Locale): string {
  const raw = iso.length === 10 ? `${iso}T12:00:00` : iso;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return iso;
  const loc =
    locale === "en"
      ? "en-GB"
      : locale === "pl"
        ? "pl-PL"
        : locale === "es"
          ? "es-ES"
          : "fr-FR";
  return d.toLocaleDateString(loc, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type SocialPostCardProps = {
  post: SocialPost;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onEdit: (post: SocialPost) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onTagClick?: (tag: string) => void;
};

export function SocialPostCard({
  post,
  index,
  canMoveUp,
  canMoveDown,
  onEdit,
  onMove,
  onTagClick,
}: SocialPostCardProps) {
  const {
    l,
    t,
    locale,
    editMode,
    updateSocialPost,
    removeSocialPost,
  } = usePortfolio();

  const title = l(post.title);
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

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.25) }}
    >
      <GlassCard
        glow
        className={cn(
          "overflow-hidden p-0",
          "ring-1 ring-cyan-300/10",
          !post.visible && "opacity-70"
        )}
      >
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-100/15 bg-cyan-100/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-100/75">
                  {category}
                </span>
                <time
                  dateTime={post.date}
                  className="text-[11px] font-medium text-zinc-500"
                >
                  {formatSocialDate(post.date, locale)}
                </time>
                {editMode && !post.visible && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                    <EyeOff className="h-3 w-3" />
                    {t("medias.hidden")}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">
                {title}
              </h3>
            </div>

            {editMode && (
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400"
                  disabled={!canMoveUp}
                  title={t("medias.moveUp")}
                  onClick={() => onMove(post.id, -1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400"
                  disabled={!canMoveDown}
                  title={t("medias.moveDown")}
                  onClick={() => onMove(post.id, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-400"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(post)}>
                      <Pencil />
                      {t("actions.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateSocialPost(post.id, { visible: !post.visible })
                      }
                    >
                      {post.visible ? <EyeOff /> : <Eye />}
                      {post.visible ? t("medias.hide") : t("medias.show")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-400 focus:text-red-300"
                      onClick={() => {
                        if (confirm(t("medias.deleteConfirm"))) {
                          removeSocialPost(post.id);
                        }
                      }}
                    >
                      <Trash2 />
                      {t("medias.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </header>

          {description ? (
            <RichHtml html={description} className="text-sm text-zinc-400" />
          ) : null}

          {post.tags && post.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <button
                    type="button"
                    onClick={() => onTagClick?.(tag)}
                    className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-50 transition hover:bg-cyan-400/20"
                  >
                    {tag}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {embed && (
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-inner">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-40"
                  aria-hidden
                />
              ) : null}
              <div className="relative aspect-video w-full">
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
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.fileUrl}
                alt={title}
                className="max-h-[480px] w-full object-contain"
              />
            </div>
          )}

          {post.fileUrl && post.fileKind === "pdf" && (
            <a
              href={post.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/15 px-3.5 py-2 text-sm font-medium text-cyan-50 transition hover:bg-cyan-400/25"
            >
              <FileDown className="h-4 w-4" />
              {post.fileName?.trim() || t("medias.downloadPdf")}
            </a>
          )}
        </div>
      </GlassCard>
    </motion.article>
  );
}
