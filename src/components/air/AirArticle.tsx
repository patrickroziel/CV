"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { PostRichBody } from "@/components/medias/PostRichBody";
import { FeaturedMedia } from "@/components/medias/FeaturedMedia";
import { PostActions } from "@/components/medias/PostActions";

export function AirArticle({id}:{id:string}){
  const {data,editMode,l,isHydrated}=usePortfolio();
  const post=(data.socialPosts??[]).find(p=>p.id===id&&p.universe==="air"&&(p.visible!==false||editMode));
  if(!isHydrated)return <div className="mx-auto h-60 max-w-3xl animate-pulse rounded-2xl bg-white/10"/>;
  if(!post)return <div className="mx-auto max-w-3xl px-4 text-zinc-200"><Link href="/air" className="text-cyan-100">← Retour à Air</Link><p className="mt-8">Article indisponible.</p></div>;
  const title=l(post.title),cover=post.bookCoverUrl;
  return <div className="mx-auto max-w-3xl px-3 sm:px-6">
    <Link href="/air" className="inline-flex items-center gap-2 text-sm text-cyan-100/80"><ArrowLeft className="h-4 w-4"/> Retour à Air</Link>
    <article className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#041d2b]/85 backdrop-blur-2xl">
      {cover&&<div className="aspect-[16/8] overflow-hidden"><img src={cover} alt="" className="h-full w-full object-cover"/></div>}
      <div className="space-y-6 p-5 sm:p-10">
        <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-cyan-100/70">AIR / {post.date}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
        {post.subtitle&&<p className="text-lg text-zinc-300">{l(post.subtitle)}</p>}
        <FeaturedMedia media={post.featuredEmbed} title={title}/>
        <PostRichBody html={l(post.description)} inlineMedia={post.inlineMedia} title={title} className="text-[15px] leading-7 text-zinc-200 [&_*]:max-w-full"/>
        <PostActions postId={post.id} title={title} visible={post.visible!==false} sharePath="/air"/>
      </div>
    </article>
  </div>;
}
