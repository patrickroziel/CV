"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Layers } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { PostRichBody } from "@/components/medias/PostRichBody";
import { FeaturedMedia } from "@/components/medias/FeaturedMedia";
import { PostActions } from "@/components/medias/PostActions";
import { PostEditButton } from "@/components/medias/PostEditButton";
import { PostPager } from "@/components/notes/PostPager";
import { ArticlePartNav } from "@/components/medias/ArticlePartNav";
import { coercePostCategory } from "@/lib/post-taxonomy";
import { getNoteSharePhotos } from "@/lib/notes-preview-image";
import { isHeldMediaUrl } from "@/lib/blob-upload";
import { WorkInProgress } from "@/components/media/WorkInProgress";
import type { SocialPost } from "@/lib/types";

function proxyBlobImages(html: string) {
  return html.replace(/https:\/\/[a-z0-9.-]*blob\.vercel-storage\.com\/[^"'\\\s)<]+/gi, (url) => `/api/media/blob?url=${encodeURIComponent(url)}`);
}

const FORCE_WHITE_ARTICLE = "adbaf437-0909-4347-a846-7910e702b954";

function ArticleCover({ sources }: { sources: string[] }) {
  const [index, setIndex] = useState(0);
  if (index >= sources.length) return null;
  const src = sources[index];
  return (
    <div className="overflow-hidden rounded-t-[1.35rem]">
      <div className="relative aspect-[16/8] sm:aspect-[16/7]">
        {isHeldMediaUrl(src) ? (
          <WorkInProgress className="absolute inset-0" />
        ) : (
          <img
            src={src}
            alt=""
            className="block h-full w-full object-cover object-center"
            onError={() => setIndex((current) => current + 1)}
          />
        )}
      </div>
    </div>
  );
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function AirReadHead({
  category,
  date,
  series,
  episode,
  title,
  bodyId,
}: {
  category: string;
  date: string;
  series: string;
  episode: string;
  title: string;
  bodyId: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const article = el.closest("article");
      if (article instanceof HTMLElement) article.style.setProperty("--article-head-h", `${el.offsetHeight}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const episodeLabel = episode ? `Épisode ${episode.replace(/^épisode\s+/i, "")}` : "";
  const seriesLabel = [series, episodeLabel].filter(Boolean).join(" · ");
  return (
    <>
      <p className="air-read-meta">{category} · {date}</p>
      <div ref={ref} className="air-read-head">
        {seriesLabel ? (
          <p className="air-series-line">
            <span className="air-frame-sheen" aria-hidden />
            <span className="air-series-mark" aria-hidden>
              <Layers className="h-3.5 w-3.5" />
            </span>
            <span>{seriesLabel}</span>
          </p>
        ) : null}
        <a href={`#${bodyId}`} className="air-title-pill" onClick={(event) => { event.preventDefault(); scrollToId(bodyId); }}>
          <span className="air-frame-sheen air-frame-sheen--late" aria-hidden />
          <h1>{title}</h1>
        </a>
        <ArticlePartNav targetId={bodyId} />
      </div>
    </>
  );
}

export function AirArticle({ id, initialPost = null, seedPosts = [] }: { id: string; initialPost?: SocialPost | null; seedPosts?: SocialPost[] }) {
  const { data, editMode, l, isHydrated } = usePortfolio();
  const fromStore = (data.socialPosts ?? []).find(p => p.id === id && p.universe === "air" && (p.visible !== false || editMode));
  const post = isHydrated ? (fromStore ?? null) : (initialPost ?? fromStore ?? null);
  if (!post && !isHydrated && initialPost === undefined) return <div className="mx-auto h-60 max-w-3xl animate-pulse rounded-2xl bg-white/10" />;
  if (!post) return <div className="mx-auto max-w-3xl px-4 text-zinc-200"><Link href="/air" className="text-cyan-100">← Retour à Air</Link><p className="mt-8">Article indisponible.</p></div>;
  const title = l(post.title);
  const series = post.subtitle ? l(post.subtitle).trim() : "";
  const episode = post.episode?.trim() ?? "";
  const bodyId = `air-body-${post.id}`;
  return <div className="mx-auto max-w-3xl px-3 pb-24 sm:px-6">
    <div className="flex items-center justify-between gap-3">
      <Link href="/air" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"><ArrowLeft className="h-4 w-4"/> Retour à Air</Link>
      <PostEditButton post={post} universe="air" />
    </div>
    <article className={`air-article air-surface mt-6 overflow-visible rounded-[1.35rem] border backdrop-blur-2xl${post.id === FORCE_WHITE_ARTICLE ? " article-force-white" : ""}`}>
      <ArticleCover sources={getNoteSharePhotos(post)} />
      <AirReadHead
        category={coercePostCategory(post)}
        date={post.date}
        series={series}
        episode={episode}
        title={title}
        bodyId={bodyId}
      />
      <div id={bodyId} className="space-y-6 px-5 pb-5 sm:px-10 sm:pb-10">
        <FeaturedMedia media={post.featuredEmbed} title={title}/>
        <PostRichBody html={proxyBlobImages(l(post.description))} inlineMedia={post.inlineMedia} title={title} className="air-article-body text-[15px] leading-7 text-white/85 [&_*]:max-w-full" />
        <PostActions postId={post.id} title={title} visible={post.visible!==false} sharePath="/air" />
      </div>
    </article>
    <PostPager postId={post.id} universe="air" seedPosts={seedPosts} />
  </div>;
}
