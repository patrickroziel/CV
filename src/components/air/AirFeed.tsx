"use client";
import Link from "next/link";
import { useMemo, useState, Fragment } from "react";
import { ArrowUpRight, FilePlus2, Pencil, Trash2 } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { SocialPostForm, type SocialPostFormValues } from "@/components/medias/SocialPostForm";
import { PostActions } from "@/components/medias/PostActions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { stripHtml } from "@/lib/sanitize-html";
import { getNoteSharePhoto } from "@/lib/notes-preview-image";
import { isTeaserPost, TEASER_PUBLIC_LINE } from "@/lib/post-publication";
import { isHeldMediaUrl } from "@/lib/blob-upload";
import { WorkInProgress } from "@/components/media/WorkInProgress";
import { KofiCard } from "@/components/support/KofiCard";
import { AirTagTicker } from "@/components/air/AirTagTicker";
import { AirSeriesLine } from "@/components/air/AirArticle";
import { UniversesWidget } from "@/components/notes/UniversesWidget";
import { collectPostTags } from "@/lib/post-taxonomy";
import type { SocialPost } from "@/lib/types";

function partTitles(html: string) {
  const titles: string[] = [];
  const pattern = /<h2\b[^>]*\bair-part-title\b[^>]*>([\s\S]*?)<\/h2>/gi;
  for (const match of html.matchAll(pattern)) {
    const text = stripHtml(match[1] ?? "").replace(/\s+/g, " ").trim();
    if (text && text.toLocaleLowerCase("fr") !== "titre de la partie") titles.push(text);
  }
  return titles;
}

function previewText(html: string) {
  const prose = html.replace(/<h2\b[^>]*\bair-part-title\b[^>]*>[\s\S]*?<\/h2>/gi, " ");
  const text = stripHtml(prose)
    .replace(/\[\[MEDIA:[a-zA-Z0-9_-]{8,80}\]\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= 420) return text;
  const window = text.slice(0, 420);
  const space = window.lastIndexOf(" ");
  return (space > 220 ? window.slice(0, space) : window).trimEnd();
}

export function AirFeed({ seedPosts = [] }: { seedPosts?: SocialPost[] }) {
  const { data, editMode, l, addSocialPost, updateSocialPost, removeSocialPost, isHydrated } = usePortfolio();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SocialPost | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const seriesName = (post: SocialPost) => (post.subtitle ? l(post.subtitle).trim() : "");
  const posts = useMemo(() => {
    const source = !isHydrated && seedPosts.length ? seedPosts : (data.socialPosts ?? []);
    return source
      .filter(p => p.universe === "air" && (editMode || p.visible !== false))
      .sort((a,b) => a.order - b.order || b.date.localeCompare(a.date));
  }, [data.socialPosts, editMode, isHydrated, seedPosts]);
  const visiblePosts = useMemo(() => {
    if (!activeTag) return posts;
    const key = activeTag.toLocaleLowerCase("fr");
    return posts.filter((post) => (post.tags ?? []).some((tag) => tag.trim().toLocaleLowerCase("fr") === key));
  }, [posts, activeTag]);
  const tags = useMemo(() => collectPostTags(visiblePosts), [visiblePosts]);
  const publish = (values: SocialPostFormValues) => {
    if (editing) updateSocialPost(editing.id,{...values,universe:"air"});
    else addSocialPost({...values,universe:"air",order:0});
    setCreateOpen(false); setEditing(null);
  };
  return <div className="mx-auto grid min-w-0 max-w-[1180px] gap-7 px-3 pb-24 sm:px-6 lg:grid-cols-[220px_minmax(0,760px)] lg:gap-16 lg:px-8">
    <aside className="air-side"><div className="lg:sticky lg:top-28">
      <p className="text-xs text-white/70">Patrick Roziel</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white drop-shadow-sm">Air</h1>
      <p className="mt-2 max-w-[18rem] text-xs leading-5 text-white/75">Décryptages, expériences et observations.</p>
      <nav className="air-side-articles" aria-label="Articles Air">
        {posts.map((post) => {
          const name = l(post.title).trim() || "Sans titre";
          return (
            <Link key={post.id} href={`/air/${post.id}`} className="air-side-article">
              {name}
            </Link>
          );
        })}
      </nav>
      <UniversesWidget current="air" />
      <KofiCard className="mt-3" />
    </div>
    </aside>
    <section aria-label="Articles AIR" className="min-w-0">
    <div className="mb-8 flex min-w-0 flex-wrap items-end justify-between gap-4 pb-2">
      <div><p className="text-[10px] font-semibold uppercase tracking-[.23em] text-white/55">Journal / Air</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-3xl">{activeTag ? `#${activeTag}` : "Articles & décryptages"}</h2></div>
      {editMode && <button onClick={()=>setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm text-white backdrop-blur-md"><FilePlus2 className="h-4 w-4"/>Nouvel article</button>}
    </div>
    {visiblePosts.length ? <div className="space-y-6">
      {visiblePosts.map((post, index) => { const photo=post.coverSource === "wip" ? null : getNoteSharePhoto(post);const title=l(post.title)||"Sans titre";
        const teaser = isTeaserPost(post);
        const parts = teaser ? [] : partTitles(l(post.description));
        const excerpt = teaser ? TEASER_PUBLIC_LINE : previewText(l(post.description));
        const seriesLabel = [seriesName(post), post.episode?.trim() ? `Épisode ${post.episode.trim().replace(/^épisode\s+/i, "")}` : ""].filter(Boolean).join(" · ");
        return <Fragment key={post.id}>
        <article className="air-surface overflow-hidden rounded-[1.35rem] border backdrop-blur-2xl transition-colors">
          <Link href={`/air/${post.id}`} className="group block">
            <div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-sky-900/20 to-sky-700/10 sm:aspect-[16/7]">
              {post.coverSource === "wip" ? (
                <WorkInProgress className="blob-wip--fill" />
              ) : photo ? (
                isHeldMediaUrl(photo) ? <WorkInProgress className="absolute inset-0" /> : <img src={photo} alt={title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : <span className="flex h-full items-center justify-center text-7xl font-light text-white/15">Air.</span>}
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-[10px] uppercase tracking-[.2em] text-white/50">{post.date}</p>
              {seriesLabel ? <div className="mt-3"><AirSeriesLine label={seriesLabel} /></div> : null}
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h3>
              {parts.length ? (
                <div className="air-part-stack mt-3">
                  {parts.map((label, partIndex) => (
                    <span key={`${partIndex}-${label}`} className="air-part-float" title={label}>
                      <span className="air-part-num">{partIndex + 1}</span>
                      <span className="air-part-name">{label}</span>
                    </span>
                  ))}
                </div>
              ) : null}
              {excerpt ? <p className="mt-3 line-clamp-4 break-words text-sm leading-6 text-white/75">{excerpt}</p> : null}
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-sky-200">Lire l’article <ArrowUpRight className="h-4 w-4"/></span>
            </div>
          </Link>
          <div className="border-t border-white/15 px-5 py-4">
            <PostActions postId={post.id} title={title} visible={post.visible !== false} sharePath="/air" />
          </div>
          {editMode && <div className="flex gap-2 border-t border-white/10 px-5 py-3">
            <button className="inline-flex items-center gap-1 text-xs text-white/70" onClick={()=>setEditing(post)}><Pencil className="h-3.5 w-3.5"/> Modifier</button>
            <button className="inline-flex items-center gap-1 text-xs text-red-300" onClick={()=>{if(window.confirm("Supprimer cet article AIR ?"))removeSocialPost(post.id)}}><Trash2 className="h-3.5 w-3.5"/> Supprimer</button>
          </div>}
        </article>
        {index === 0 ? <KofiCard /> : null}
        </Fragment>;
      })}
    </div> : <div className="air-surface rounded-2xl border p-10 text-center backdrop-blur-xl">
      <p className="text-[10px] uppercase tracking-[.2em] text-white/50">{activeTag ? "Sélection" : "À suivre"}</p>
      <h3 className="mt-3 text-xl text-white">{activeTag ? "Aucun article dans cette sélection." : "Les premiers articles prennent forme."}</h3>
      {!activeTag ? <p className="mt-3 text-sm text-white/70">Ici paraîtront mes décryptages, expériences et observations.</p> : null}
    </div>}
    <Dialog open={createOpen || !!editing} onOpenChange={v=>{if(!v){setCreateOpen(false);setEditing(null)}}}>
      <DialogContent size="form" className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing?"Modifier un article AIR":"Nouvel article AIR"}</DialogTitle></DialogHeader>
      <SocialPostForm key={editing?.id ?? "new-air"} universe="air" initial={editing ?? undefined}
        onSubmit={publish} onCancel={()=>{setCreateOpen(false);setEditing(null)}} submitLabel={editing?"Enregistrer":"Publier"} />
      </DialogContent>
    </Dialog>
    </section>
    <AirTagTicker
      tags={tags}
      activeTag={activeTag}
      onClear={() => setActiveTag(null)}
      onToggle={(tag) => setActiveTag((current) => current?.toLocaleLowerCase("fr") === tag.toLocaleLowerCase("fr") ? null : tag)}
    />
  </div>;
}
