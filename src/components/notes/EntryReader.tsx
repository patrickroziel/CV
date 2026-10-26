"use client";
import Link from "next/link";
import { ArrowLeft, FileDown } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { PostRichBody } from "@/components/medias/PostRichBody";
import { BookReader } from "@/components/notes/BookReader";
import { FeaturedMedia } from "@/components/medias/FeaturedMedia";
import { PostActions } from "@/components/medias/PostActions";
import { PostComments } from "@/components/notes/PostComments";
import type { FeaturedEmbed } from "@/lib/types";

function formatDate(iso: string) {
  const date = new Date(iso.length === 10 ? iso + "T12:00:00" : iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

/** One shareable permalink for every Notes post, not only book chapters. */
export function EntryReader({ id }: { id: string }) {
  const { data, editMode, l, isHydrated } = usePortfolio();
  const post = (data.socialPosts ?? []).find(item => item.id === id && (editMode || item.visible !== false));

  if (!isHydrated) return <div className="mx-auto h-40 max-w-3xl animate-pulse rounded-3xl border border-white/5 bg-white/[0.025]" />;
  if (!post) return <div className="mx-auto max-w-3xl px-3 sm:px-6">
    <Link href="/notes" className="text-sm text-cyan-100">← Retour à Notes</Link>
    <p className="mt-6 text-sm text-zinc-400">Cette publication n’est pas disponible.</p>
  </div>;
  if (post.category === "Livre") return <BookReader id={id} />;

  const title = l(post.title).trim() || (editMode ? "Brouillon" : "");
  const featured: FeaturedEmbed | null = post.featuredEmbed ??
    (post.youtubeUrl ? { type: "youtube", url: post.youtubeUrl } : null);

  return <div className="mx-auto min-w-0 max-w-3xl px-3 sm:px-6">
    <Link href="/notes" className="inline-flex items-center gap-2 text-sm text-cyan-100/65 hover:text-cyan-50">
      <ArrowLeft className="h-4 w-4" /> Retour à Notes
    </Link>
    <article className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[rgba(3,16,20,0.72)] shadow-2xl backdrop-blur-2xl">
      {post.bookCoverUrl && <div className="relative aspect-[16/8] w-full overflow-hidden border-b border-white/10 bg-black/30 sm:aspect-[16/7]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.bookCoverUrl} className="h-full w-full object-cover" alt="" />
      </div>}
      <div className="min-w-0 space-y-6 p-4 sm:p-8 md:p-10">
        <header>
          <p className="text-xs uppercase tracking-[0.15em] text-cyan-100/55">{post.category ?? "Réflexions"} · {formatDate(post.date)}</p>
          <h1 className="mt-3 break-words text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
          {post.subtitle && <p className="mt-3 text-sm text-zinc-400">{l(post.subtitle)}</p>}
        </header>
        <FeaturedMedia media={featured} title={title} />
        {post.fileKind === "image" && post.fileUrl && post.fileUrl !== featured?.url && post.fileUrl !== post.bookCoverUrl &&
          <div className="relative aspect-video w-full max-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.fileUrl} alt={title} className="absolute inset-0 h-full w-full object-cover object-center" />
          </div>}
        <PostRichBody html={l(post.description)} inlineMedia={post.inlineMedia} title={title} className="min-w-0 max-w-full overflow-hidden text-[15px] leading-7 text-zinc-200 [&_*]:max-w-full [&_a]:break-all" />
        {post.fileKind === "pdf" && post.fileUrl && <a href={post.fileUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
          <FileDown className="h-4 w-4" /> {post.fileName || "Télécharger le document"}
        </a>}
        <PostActions postId={post.id} title={title} visible={post.visible !== false} />
        {post.visible !== false && post.universe !== "air" && <PostComments postId={post.id} />}
      </div>
    </article>
  </div>;
}
