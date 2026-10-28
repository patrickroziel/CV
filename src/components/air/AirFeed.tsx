"use client";
import Link from "next/link";
import { useMemo, useState, Fragment } from "react";
import { ArrowUpRight, Briefcase, FilePlus2, Pencil, Route, Scale, Trash2 } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { SocialPostForm, type SocialPostFormValues } from "@/components/medias/SocialPostForm";
import { PostActions } from "@/components/medias/PostActions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { stripHtml } from "@/lib/sanitize-html";
import { getNoteSharePhoto } from "@/lib/notes-preview-image";
import { KofiCard } from "@/components/support/KofiCard";
import { PostTagList } from "@/components/medias/PostTagList";
import { AIR_CATEGORIES, coercePostCategory, collectPostTags, type AirCategory } from "@/lib/post-taxonomy";
import type { SocialPost } from "@/lib/types";

function previewText(html: string) {
  const text = stripHtml(html)
    .replace(/\[\[MEDIA:[a-zA-Z0-9_-]{8,80}\]\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= 700) return text;
  const window = text.slice(0, 700);
  const space = window.lastIndexOf(" ");
  return (space > 400 ? window.slice(0, space) : window).trimEnd();
}

export function AirFeed({ seedPosts = [] }: { seedPosts?: SocialPost[] }) {
  const { data, editMode, l, addSocialPost, updateSocialPost, removeSocialPost, isHydrated } = usePortfolio();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SocialPost | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [scope, setScope] = useState<"Tout" | AirCategory>("Tout");
  const posts = useMemo(() => {
    const source = !isHydrated && seedPosts.length ? seedPosts : (data.socialPosts ?? []);
    return source
      .filter(p => p.universe === "air" && (editMode || p.visible !== false))
      .sort((a,b) => a.order - b.order || b.date.localeCompare(a.date));
  }, [data.socialPosts, editMode, isHydrated, seedPosts]);
  const scopedPosts = useMemo(
    () => (scope === "Tout" ? posts : posts.filter((post) => coercePostCategory(post) === scope)),
    [posts, scope]
  );
  const tags = useMemo(() => collectPostTags(scopedPosts), [scopedPosts]);
  const visiblePosts = useMemo(() => {
    if (!activeTag) return scopedPosts;
    const key = activeTag.toLocaleLowerCase("fr");
    return scopedPosts.filter((post) => (post.tags ?? []).some((tag) => tag.trim().toLocaleLowerCase("fr") === key));
  }, [scopedPosts, activeTag]);
  const publish = (values: SocialPostFormValues) => {
    if (editing) updateSocialPost(editing.id,{...values,universe:"air"});
    else addSocialPost({...values,universe:"air",order:0});
    setCreateOpen(false); setEditing(null);
  };
  return <div className="mx-auto grid min-w-0 max-w-[1180px] gap-7 px-3 sm:px-6 lg:grid-cols-[220px_minmax(0,760px)] lg:gap-16 lg:px-8">
    <aside><div className="lg:sticky lg:top-28">
      <p className="text-xs text-white/70">Patrick Roziel</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white drop-shadow-sm">Air</h1>
      <p className="mt-2 max-w-[18rem] text-xs leading-5 text-white/75">Décryptages, expériences et observations.</p>
      <nav className="mt-6 flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible" aria-label="Catégories Air">
        {(["Tout", ...AIR_CATEGORIES] as const).map((item) => {
          const active = scope === item;
          const Icon = item === "Parcours" ? Route : item === "Travail" ? Briefcase : item === "Droits" ? Scale : null;
          const count = item === "Tout" ? posts.length : posts.filter((post) => coercePostCategory(post) === item).length;
          return (
            <button
              key={item}
              type="button"
              onClick={() => { setScope(item); setActiveTag(null); }}
              className={`flex shrink-0 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm lg:w-full ${active ? "border-white/50 bg-white/20 text-white" : "border-transparent text-white/70 hover:bg-white/10 hover:text-white"}`}
            >
              <span className="inline-flex items-center gap-2">
                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                {item}
              </span>
              <span className="text-[10px] text-white/50">{count}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)]">
        <p className="text-[10px] uppercase tracking-[.24em] text-white/60">À propos d’Air</p>
        <p className="mt-3 text-sm leading-6 text-white/90">Regarder les choses en face. Les comprendre. Les formuler.</p>
        <p className="mt-3 text-xs leading-5 text-white/75">Un espace de réflexion et de transmission autour de la communication, des institutions et des expériences qui poussent à questionner ce qui semble aller de soi.</p>
      </div>
      <KofiCard className="mt-3" />
    </div>
    <PostTagList
      tags={tags}
      activeTag={activeTag}
      tone="light"
      onClear={() => setActiveTag(null)}
      onToggle={(tag) => setActiveTag((current) => current?.toLocaleLowerCase("fr") === tag.toLocaleLowerCase("fr") ? null : tag)}
    />
    </aside>
    <section aria-label="Articles AIR" className="min-w-0">
    <div className="mb-8 flex min-w-0 flex-wrap items-end justify-between gap-4 pb-2">
      <div><p className="text-[10px] font-semibold uppercase tracking-[.23em] text-white/55">Journal / Air</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-3xl">{activeTag ? `#${activeTag}` : scope === "Tout" ? "Articles & décryptages" : scope}</h2></div>
      {editMode && <button onClick={()=>setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm text-white backdrop-blur-md"><FilePlus2 className="h-4 w-4"/>Nouvel article</button>}
    </div>
    {visiblePosts.length ? <div className="space-y-6">
      {visiblePosts.map((post, index) => { const photo=getNoteSharePhoto(post);const title=l(post.title)||"Sans titre";
        const excerpt = previewText(l(post.description));
        return <Fragment key={post.id}>
        <article className="overflow-hidden rounded-[1.35rem] border border-white/12 bg-white/8 shadow-[0_16px_48px_-20px_rgba(0,0,0,0.45)] transition-all hover:bg-white/12 hover:border-white/20 backdrop-blur-2xl">
          <Link href={`/air/${post.id}`} className="group block">
            <div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-sky-900/20 to-sky-700/10 sm:aspect-[16/7]">
              {photo ? <img src={photo} alt={title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <span className="flex h-full items-center justify-center text-7xl font-light text-white/15">Air.</span>}
            </div>
            <div className="p-5 sm:p-6"><p className="text-[10px] uppercase tracking-[.2em] text-white/50">{coercePostCategory(post)} · {post.date}</p><h3 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h3>
              {post.subtitle ? <p className="mt-1 text-sm leading-6 text-white/70">{l(post.subtitle)}</p> : null}
              <p className="mt-3 line-clamp-4 break-words text-sm leading-6 text-white/75">{excerpt}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-sky-200">Lire l’article <ArrowUpRight className="h-4 w-4"/></span></div>
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
    </div> : <div className="rounded-2xl border border-white/12 bg-white/8 p-10 text-center backdrop-blur-xl">
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
  </div>;
}
