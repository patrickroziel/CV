"use client";
import Link from "next/link";
import { ArrowLeft, FileDown } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { PostRichBody } from "@/components/medias/PostRichBody";
import { BookReader } from "@/components/notes/BookReader";
import { FeaturedMedia } from "@/components/medias/FeaturedMedia";
import { PostCover } from "@/components/media/PostCover";
import { PostActions } from "@/components/medias/PostActions";
import { NotesBottomNav } from "@/components/notes/PostPager";
import { NotesFloatingStack, stampNotePartAnchors } from "@/components/medias/ArticlePartNav";
import { shareExcerpt } from "@/lib/post-excerpt";
import { coercePostCategory } from "@/lib/post-taxonomy";
import { isTeaserPost, TEASER_LABEL, TEASER_PUBLIC_LINE } from "@/lib/post-publication";
import { displayImageUrl } from "@/lib/display-image";
import type { FeaturedEmbed, SocialPost } from "@/lib/types";

function formatDate(iso: string) {
  const date = new Date(iso.length === 10 ? iso + "T12:00:00" : iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export function EntryReader({ id, initialPost = null, seedPosts = [] }: { id: string; initialPost?: SocialPost | null; seedPosts?: SocialPost[] }) {
  const { data, editMode, l, isHydrated } = usePortfolio();
  const fromStore = (data.socialPosts ?? []).find(item => item.id === id && (editMode || item.visible !== false) && item.universe !== "air");
  const post = isHydrated ? (fromStore ?? null) : (initialPost ?? fromStore ?? null);

  if (!post && !isHydrated && initialPost === undefined) return <div className="mx-auto h-40 max-w-3xl animate-pulse rounded-3xl border border-white/5 bg-white/[0.025]" />;
  if (!post) return <div className="mx-auto max-w-3xl px-3 sm:px-6">
    <Link href="/notes" className="text-sm text-cyan-100">← Retour à Notes</Link>
    <p className="mt-6 text-sm text-zinc-400">Cette publication n’est pas disponible.</p>
  </div>;
  if (post.category === "Livre" || coercePostCategory(post) === "Livre") return <BookReader id={id} initialPost={post} seedPosts={seedPosts} />;

  const title = l(post.title).trim() || (editMode ? "Brouillon" : "");
  const category = coercePostCategory(post);
  const teaser = isTeaserPost(post);
  const featured: FeaturedEmbed | null = teaser ? null : (post.featuredEmbed ??
    (post.youtubeUrl ? { type: "youtube", url: post.youtubeUrl } : null));

  return <div className="mx-auto min-w-0 max-w-3xl px-3 sm:px-6">
    <NotesBottomNav post={post} seedPosts={seedPosts} />
    <article className="mt-3 overflow-visible rounded-[1.75rem] border border-white/10 bg-[rgba(3,16,20,0.72)] shadow-2xl backdrop-blur-2xl">
      <div className="overflow-hidden rounded-t-[1.75rem]">
        <PostCover post={post} alt={title} />
      </div>
      <div className="min-w-0 px-4 pb-4 pt-5 sm:px-8 sm:pb-8 sm:pt-7 md:px-10 md:pb-10">
        <p className="text-[11px] tracking-[0.04em] text-cyan-100/55">{category} · {formatDate(post.date)}{teaser ? ` · ${TEASER_LABEL}` : ""}</p>
        <h1 id={`note-title-${post.id}`} className="mt-4 break-words text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">{title}</h1>
        {post.subtitle && <p className="mt-3 break-words text-sm leading-7 text-zinc-400 sm:text-base">{l(post.subtitle)}</p>}
        {!teaser && <NotesFloatingStack postId={post.id} title={title} subtitle={post.subtitle ? l(post.subtitle) : ""} />}
        <div id={`note-body-${post.id}`} className="mt-6 min-w-0 space-y-6">
        {teaser ? <p className="text-sm leading-7 text-zinc-400">{TEASER_PUBLIC_LINE}</p> : <>
        <FeaturedMedia media={featured} title={title} />
        {post.fileKind === "image" && post.fileUrl && post.fileUrl !== featured?.url && post.fileUrl !== post.bookCoverUrl &&
          <div className="relative aspect-video w-full max-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displayImageUrl(post.fileUrl, 1200)} alt={title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-center" />
          </div>}
        <PostRichBody html={stampNotePartAnchors(l(post.description), post.id)} inlineMedia={post.inlineMedia} title={title} className="notes-force-white min-w-0 max-w-full overflow-hidden text-[15px] text-white [&_*]:max-w-full [&_a]:break-all" />
        {post.fileKind === "pdf" && post.fileUrl && <a href={post.fileUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
          <FileDown className="h-4 w-4" /> {post.fileName || "Télécharger le document"}
        </a>}
        </>}
        <PostActions postId={post.id} title={title} summary={teaser ? "" : shareExcerpt(l(post.description))} visible={post.visible !== false} comments />
        </div>
      </div>
    </article>
  </div>;
}
