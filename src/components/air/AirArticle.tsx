"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { PostRichBody } from "@/components/medias/PostRichBody";
import { FeaturedMedia } from "@/components/medias/FeaturedMedia";
import { PostActions } from "@/components/medias/PostActions";
import { PostEditButton } from "@/components/medias/PostEditButton";
import { PostPager } from "@/components/notes/PostPager";
import { coercePostCategory } from "@/lib/post-taxonomy";
import { getNoteSharePhoto } from "@/lib/notes-preview-image";
import type { SocialPost } from "@/lib/types";

function proxyBlobImages(html: string) {
  return html.replace(/https:\/\/[a-z0-9.-]*blob\.vercel-storage\.com\/[^"'\\\s)<]+/gi, (url) => `/api/media/blob?url=${encodeURIComponent(url)}`);
}

export function AirArticle({ id, initialPost = null, seedPosts = [] }: { id: string; initialPost?: SocialPost | null; seedPosts?: SocialPost[] }) {
  const { data, editMode, l, isHydrated } = usePortfolio();
  const fromStore = (data.socialPosts ?? []).find(p => p.id === id && p.universe === "air" && (p.visible !== false || editMode));
  const post = isHydrated ? (fromStore ?? null) : (initialPost ?? fromStore ?? null);
  if (!post && !isHydrated && initialPost === undefined) return <div className="mx-auto h-60 max-w-3xl animate-pulse rounded-2xl bg-white/10" />;
  if (!post) return <div className="mx-auto max-w-3xl px-4 text-zinc-200"><Link href="/air" className="text-cyan-100">← Retour à Air</Link><p className="mt-8">Article indisponible.</p></div>;
  const title=l(post.title),cover=getNoteSharePhoto(post);
  return <div className="mx-auto max-w-3xl px-3 pb-24 sm:px-6">
    <div className="flex items-center justify-between gap-3">
      <Link href="/air" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"><ArrowLeft className="h-4 w-4"/> Retour à Air</Link>
      <PostEditButton post={post} universe="air" />
    </div>
    <article className="air-surface mt-6 overflow-hidden rounded-[1.35rem] border backdrop-blur-2xl">
      {cover&&<div className="aspect-[16/8] overflow-hidden sm:aspect-[16/7]"><img src={cover} alt={title} className="h-full w-full object-cover"/></div>}
      <div className="space-y-6 p-5 sm:p-10">
        <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-white/55">{coercePostCategory(post)} · {post.date}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
        {post.subtitle&&<p className="text-lg text-white/75">{l(post.subtitle)}</p>}
        <FeaturedMedia media={post.featuredEmbed} title={title}/>
        <PostRichBody html={proxyBlobImages(l(post.description))} inlineMedia={post.inlineMedia} title={title} className="air-article-body text-[15px] leading-7 text-white/85 [&_*]:max-w-full"/>
        <PostActions postId={post.id} title={title} visible={post.visible!==false} sharePath="/air" />
      </div>
    </article>
    <PostPager postId={post.id} universe="air" seedPosts={seedPosts} />
  </div>;
}
