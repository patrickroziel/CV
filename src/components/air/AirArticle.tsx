"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Layers } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { PostRichBody } from "@/components/medias/PostRichBody";
import { FeaturedMedia } from "@/components/medias/FeaturedMedia";
import { PostActions } from "@/components/medias/PostActions";
import { PostEditButton } from "@/components/medias/PostEditButton";
import { PostPager } from "@/components/notes/PostPager";
import { ArticlePartNav } from "@/components/medias/ArticlePartNav";
import { getNoteSharePhotos } from "@/lib/notes-preview-image";
import { isHeldMediaUrl } from "@/lib/blob-upload";
import { isTeaserPost, TEASER_LABEL, TEASER_PUBLIC_LINE } from "@/lib/post-publication";
import { WorkInProgress } from "@/components/media/WorkInProgress";
import { RichHtml } from "@/components/shared/RichHtml";
import { AIR_NOTICE_INTRO, AIR_NOTICE_REPLY, airNoticeHtml } from "@/lib/air-notices";
import type { SocialPost } from "@/lib/types";

function proxyBlobImages(html: string) {
  return html.replace(/https:\/\/[a-z0-9.-]*blob\.vercel-storage\.com\/[^"'\\\s)<]+/gi, (url) => `/api/media/blob?url=${encodeURIComponent(url)}`);
}

const FORCE_WHITE_ARTICLE = "adbaf437-0909-4347-a846-7910e702b954";

function ArticleCover({ sources, seriesLabel }: { sources: string[]; seriesLabel?: string }) {
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
        {seriesLabel ? (
          <div className="air-cover-series">
            <AirSeriesLine label={seriesLabel} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function airPartAnchor(postId: string, index: number) {
  return `part-${index}-air-body-${postId}`;
}

function stampPartAnchors(html: string, postId: string) {
  let index = 0;
  return html.replace(/<h2\b([^>]*\bair-part-title\b[^>]*)>/gi, (_full, attrs: string) => {
    const id = airPartAnchor(postId, index);
    index += 1;
    if (/\sid\s*=/i.test(attrs)) return `<h2${attrs}>`;
    return `<h2 id="${id}"${attrs}>`;
  });
}

function seriesLine(series: string, episode: string) {
  const episodeLabel = episode ? `Épisode ${episode.replace(/^épisode\s+/i, "")}` : "";
  return [series, episodeLabel].filter(Boolean).join(" · ");
}

export function AirSeriesLine({ label }: { label: string }) {
  if (!label) return null;
  return (
    <p className="air-series-line">
      <span className="air-frame-sheen" aria-hidden />
      <span className="air-series-mark" aria-hidden>
        <Layers className="h-3.5 w-3.5" />
      </span>
      <span>{label}</span>
    </p>
  );
}

function AirReadHead({
  title,
  lead,
  bodyId,
}: {
  title: string;
  lead: string;
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
  return (
    <>
      <div ref={ref} className="air-read-head">
        <a href={`#${bodyId}`} className="air-title-pill" onClick={(event) => { event.preventDefault(); scrollToId(bodyId); }}>
          <span className="air-frame-sheen air-frame-sheen--late" aria-hidden />
          <h1>{title}</h1>
        </a>
        {lead ? <p className="air-lead-pill">{lead}</p> : null}
        <ArticlePartNav targetId={bodyId} />
      </div>
    </>
  );
}

export function AirArticle({ id, initialPost = null, seedPosts = [] }: { id: string; initialPost?: SocialPost | null; seedPosts?: SocialPost[] }) {
  const { data, editMode, l, isHydrated } = usePortfolio();
  const fromStore = (data.socialPosts ?? []).find(p => p.id === id && p.universe === "air" && (p.visible !== false || editMode));
  const post = isHydrated ? (fromStore ?? null) : (initialPost ?? fromStore ?? null);
  useEffect(() => {
    const anchor = window.location.hash.replace(/^#/, "");
    if (!anchor || !post) return;
    const jump = () => document.getElementById(anchor)?.scrollIntoView({ block: "start" });
    jump();
    const frame = window.requestAnimationFrame(jump);
    return () => window.cancelAnimationFrame(frame);
  }, [post?.id]);
  const pageRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const page = pageRef.current;
    const bar = barRef.current;
    if (!page || !bar) return;
    const apply = () => page.style.setProperty("--air-float-h", `${bar.offsetHeight + 12}px`);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [post?.id]);
  if (!post && !isHydrated && initialPost === undefined) return <div className="mx-auto h-60 max-w-3xl animate-pulse rounded-2xl bg-white/10" />;
  if (!post) return <div className="mx-auto max-w-3xl px-4 text-zinc-200"><Link href="/air" className="text-cyan-100">← Retour à Air</Link><p className="mt-8">Article indisponible.</p></div>;
  const title = l(post.title);
  const series = post.subtitle ? l(post.subtitle).trim() : "";
  const lead = post.articleSubtitle ? l(post.articleSubtitle).trim() : "";
  const episode = post.episode?.trim() ?? "";
  const seriesLabel = seriesLine(series, episode);
  const bodyId = `air-body-${post.id}`;
  const teaser = isTeaserPost(post);
  const showNotices = post.noticesHidden !== true;
  return <div ref={pageRef} className="mx-auto max-w-3xl px-3 pb-24 sm:px-6">
    <div ref={barRef} className="air-float-bar">
      <PostPager
        postId={post.id}
        universe="air"
        seedPosts={seedPosts}
        placement="pills"
        extra={<PostEditButton post={post} universe="air" className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full border border-white/20 bg-[#071433]/75 px-3 py-2 text-sm text-white/90 shadow-[0_10px_28px_rgba(2,8,28,0.45)] backdrop-blur-md hover:bg-[#071433]/90 hover:text-white" />}
      />
    </div>
    <article className={`air-article air-surface mt-3 overflow-visible rounded-[1.35rem] border backdrop-blur-2xl${post.id === FORCE_WHITE_ARTICLE ? " article-force-white" : ""}`}>
      {post.coverSource === "wip" ? (
        <div className="overflow-hidden rounded-t-[1.35rem]">
          <div className="relative aspect-[16/8] sm:aspect-[16/7]">
            <WorkInProgress className="blob-wip--fill" />
            {seriesLabel ? (
              <div className="air-cover-series">
                <AirSeriesLine label={seriesLabel} />
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <ArticleCover sources={getNoteSharePhotos(post)} seriesLabel={seriesLabel} />
      )}
      {showNotices && (
        <RichHtml html={airNoticeHtml(post.noticeIntro, AIR_NOTICE_INTRO)} className="px-5 pt-4 italic text-[13.5px] leading-6 text-white/70 sm:px-10" />
      )}
      <AirReadHead
        title={title}
        lead={lead}
        bodyId={bodyId}
      />
      <div id={bodyId} className="space-y-6 px-5 pb-5 sm:px-10 sm:pb-10">
        {teaser ? <p className="text-sm leading-7 text-white/70">{TEASER_PUBLIC_LINE}</p> : <>
        <FeaturedMedia media={post.featuredEmbed} title={title}/>
        <PostRichBody html={stampPartAnchors(proxyBlobImages(l(post.description)), post.id)} inlineMedia={post.inlineMedia} title={title} className="air-article-body text-[15px] leading-7 text-white/85 [&_*]:max-w-full" />
        </>}
        <PostActions postId={post.id} title={title} visible={post.visible!==false} sharePath="/air" />
        <p className="text-right text-xs tracking-wide text-white/45">{teaser ? `${post.date} · ${TEASER_LABEL}` : post.date}</p>
        {showNotices && (
          <RichHtml html={airNoticeHtml(post.noticeReply, AIR_NOTICE_REPLY)} className="border-t border-white/10 pt-4 text-[13px] leading-6 text-white/55" />
        )}
      </div>
    </article>
  </div>;
}
