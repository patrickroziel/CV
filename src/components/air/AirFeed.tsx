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
import { displayImageUrl } from "@/lib/display-image";
import { isHeldMediaUrl } from "@/lib/blob-upload";
import { WorkInProgress } from "@/components/media/WorkInProgress";
import { KofiCard } from "@/components/support/KofiCard";
import { AirTagTicker } from "@/components/air/AirTagTicker";
import { AirSeriesLine, airPartAnchor } from "@/components/air/AirArticle";
import { UniversesWidget } from "@/components/notes/UniversesWidget";
import { collectPostTags } from "@/lib/post-taxonomy";
import type { SocialPost } from "@/lib/types";

function partTitles(html: string) {
  const titles: { label: string; index: number }[] = [];
  const pattern = /<h2\b[^>]*\bair-part-title\b[^>]*>([\s\S]*?)<\/h2>/gi;
  let index = 0;
  for (const match of html.matchAll(pattern)) {
    const text = stripHtml(match[1] ?? "").replace(/\s+/g, " ").trim();
    if (text && text.toLocaleLowerCase("fr") !== "titre de la partie") titles.push({ label: text, index });
    index += 1;
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
  const [scope, setScope] = useState("Tout");
  const [pinnedSeries, setPinnedSeries] = useState<string | null>(null);
  const seriesName = (post: SocialPost) => (post.subtitle ? l(post.subtitle).trim() : "");
  const posts = useMemo(() => {
    const source = !isHydrated && seedPosts.length ? seedPosts : (data.socialPosts ?? []);
    return source
      .filter(p => p.universe === "air" && (editMode || p.visible !== false))
      .sort((a,b) => a.order - b.order || b.date.localeCompare(a.date));
  }, [data.socialPosts, editMode, isHydrated, seedPosts]);
  const series = useMemo(() => {
    const seen = new Map<string, string>();
    for (const post of posts) {
      const name = seriesName(post);
      const key = name.toLocaleLowerCase("fr");
      if (name && !seen.has(key)) seen.set(key, name);
    }
    return [...seen.values()];
  }, [posts, l]);
  const scopedPosts = useMemo(
    () => (scope === "Tout" ? posts : posts.filter((post) => seriesName(post).toLocaleLowerCase("fr") === scope.toLocaleLowerCase("fr"))),
    [posts, scope, l]
  );
  const visiblePosts = useMemo(() => {
    if (!activeTag) return scopedPosts;
    const key = activeTag.toLocaleLowerCase("fr");
    return scopedPosts.filter((post) => (post.tags ?? []).some((tag) => tag.trim().toLocaleLowerCase("fr") === key));
  }, [scopedPosts, activeTag]);
  const tags = useMemo(() => collectPostTags(visiblePosts), [visiblePosts]);
  const scopeCount = scope === "Tout" ? posts.length : posts.filter((post) => seriesName(post).toLocaleLowerCase("fr") === scope.toLocaleLowerCase("fr")).length;
  const publish = (values: SocialPostFormValues) => {
    if (editing) updateSocialPost(editing.id,{...values,universe:"air"});
    else addSocialPost({...values,universe:"air",order:0});
    setCreateOpen(false); setEditing(null);
  };
  return <div className="mx-auto grid min-w-0 max-w-[1180px] gap-7 px-3 pb-24 sm:px-6 lg:grid-cols-[220px_minmax(0,760px)] lg:gap-16 lg:px-8">
    <aside><div className="lg:sticky lg:top-28">
      <p className="text-xs text-white/70">Patrick Roziel</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white drop-shadow-sm">Air</h1>
      <p className="mt-2 max-w-[18rem] text-xs leading-5 text-white/75">Décryptages, expériences et observations.</p>
      <nav className="mt-6 space-y-1" aria-label="Séries Air">
        {series.map((name) => {
          const key = name.toLocaleLowerCase("fr");
          const active = scope.toLocaleLowerCase("fr") === key;
          const episodes = posts
            .filter((post) => seriesName(post).toLocaleLowerCase("fr") === key)
            .sort((a, b) => {
              const number = (post: SocialPost) => Number(post.episode?.replace(/\D/g, "")) || 999;
              return number(a) - number(b) || b.date.localeCompare(a.date);
            });
          const pinned = pinnedSeries?.toLocaleLowerCase("fr") === key;
          return (
            <div key={name} className="group/series">
              <button
                type="button"
                onClick={() => { setScope(active ? "Tout" : name); setActiveTag(null); setPinnedSeries(pinned ? null : name); }}
                aria-expanded={pinned}
                aria-label={`${name}, ${episodes.length} article${episodes.length > 1 ? "s" : ""}`}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm ${active ? "border-white/50 bg-white/20 text-white" : "border-transparent text-white/70 hover:bg-white/10 hover:text-white"}`}
              >
                <span className="min-w-0 flex-1 break-words">{name}</span>
                <span className="shrink-0 rounded-full border border-white/25 bg-white/15 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">{episodes.length}</span>
              </button>
              <div className={`mt-1 space-y-0.5 pl-2 ${pinned ? "block" : "hidden group-hover/series:block"}`}>
                {episodes.map((post) => {
                  const title = l(post.title).trim() || "Sans titre";
                  const episode = post.episode?.trim().replace(/^épisode\s+/i, "");
                  return (
                    <Link key={post.id} href={`/air/${post.id}`} title={title} className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 text-white/80 hover:bg-white/10 hover:text-white">
                      {episode ? <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#305080] px-1 text-[10px] font-semibold tabular-nums text-white ring-1 ring-white/30">{episode}</span> : null}
                      <span className="min-w-0 flex-1 truncate text-xs">{title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
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
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-3xl">{activeTag ? `#${activeTag}` : scope === "Tout" ? "Articles & décryptages" : scope}{!activeTag && scope !== "Tout" ? <span className="ml-3 align-middle text-base font-medium text-white/60">{scopeCount} article{scopeCount > 1 ? "s" : ""}</span> : null}</h2></div>
      {editMode && <button onClick={()=>setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm text-white backdrop-blur-md"><FilePlus2 className="h-4 w-4"/>Nouvel article</button>}
    </div>
    {visiblePosts.length ? <div className="space-y-6">
      {visiblePosts.map((post, index) => { const photo=post.coverSource === "wip" ? null : getNoteSharePhoto(post);const title=l(post.title)||"Sans titre";
        const teaser = isTeaserPost(post);
        const parts = teaser ? [] : partTitles(l(post.description));
        const excerpt = teaser ? TEASER_PUBLIC_LINE : previewText(l(post.description));
        const seriesLabel = [seriesName(post), post.episode?.trim() ? `Épisode ${post.episode.trim().replace(/^épisode\s+/i, "")}` : ""].filter(Boolean).join(" · ");
        const lead = post.articleSubtitle ? l(post.articleSubtitle).trim() : "";
        return <Fragment key={post.id}>
        <article className="air-surface overflow-hidden rounded-[1.35rem] border backdrop-blur-2xl transition-colors">
          <Link href={`/air/${post.id}`} className="group block">
            <div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-sky-900/20 to-sky-700/10 sm:aspect-[16/7]">
              {post.coverSource === "wip" ? (
                <WorkInProgress className="blob-wip--fill" />
              ) : photo ? (
                isHeldMediaUrl(photo) ? <WorkInProgress className="absolute inset-0" /> : <img src={displayImageUrl(photo, 1200)} alt={title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : <span className="flex h-full items-center justify-center text-7xl font-light text-white/15">Air.</span>}
              {seriesLabel ? (
                <div className="air-cover-series">
                  <AirSeriesLine label={seriesLabel} />
                </div>
              ) : null}
            </div>
          </Link>
          <div className="p-5 sm:p-6">
            <Link href={`/air/${post.id}`} className="block">
              <p className="text-[10px] uppercase tracking-[.2em] text-white/50">{post.date}</p>
              <h3 className="air-title-pill mt-3 text-base font-semibold leading-snug text-white sm:text-lg">{title}</h3>
              {lead ? <p className="air-lead-pill">{lead}</p> : null}
            </Link>
            {parts.length ? (
              <div className="air-part-stack mt-3">
                {parts.map((part) => (
                  <Link key={part.index} href={`/air/${post.id}#${airPartAnchor(post.id, part.index)}`} className="air-part-float" title={part.label}>
                    <span className="air-part-num">{part.index + 1}</span>
                    <span className="air-part-name">{part.label}</span>
                  </Link>
                ))}
              </div>
            ) : null}
            <Link href={`/air/${post.id}`} className="block">
              {excerpt ? <p className="mt-3 line-clamp-4 break-words text-sm leading-6 text-white/75">{excerpt}</p> : null}
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-sky-200">Lire l’article <ArrowUpRight className="h-4 w-4"/></span>
            </Link>
          </div>
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
      <p className="text-[10px] uppercase tracking-[.2em] text-white/50">{activeTag || scope !== "Tout" ? "Sélection" : "À suivre"}</p>
      <h3 className="mt-3 text-xl text-white">{activeTag || scope !== "Tout" ? "Aucun article dans cette sélection." : "Les premiers articles prennent forme."}</h3>
      {!activeTag && scope === "Tout" ? <p className="mt-3 text-sm text-white/70">Ici paraîtront mes décryptages, expériences et observations.</p> : null}
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
