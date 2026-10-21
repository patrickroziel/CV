"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, FilePlus2, Pencil, Trash2 } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { SocialPostForm, type SocialPostFormValues } from "@/components/medias/SocialPostForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { stripHtml } from "@/lib/sanitize-html";
import { getNoteSharePhoto } from "@/lib/notes-preview-image";
import type { SocialPost } from "@/lib/types";

export function AirFeed() {
  const { data, editMode, l, addSocialPost, updateSocialPost, removeSocialPost } = usePortfolio();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SocialPost | null>(null);
  const posts = useMemo(() => (data.socialPosts ?? [])
    .filter(p => p.universe === "air" && (editMode || p.visible !== false))
    .sort((a,b) => a.order - b.order || b.date.localeCompare(a.date)),
    [data.socialPosts,editMode]);
  const publish = (values: SocialPostFormValues) => {
    if (editing) updateSocialPost(editing.id,{...values,universe:"air"});
    else addSocialPost({...values,universe:"air",order:0});
    setCreateOpen(false); setEditing(null);
  };
  return <section aria-label="Articles AIR" className="mx-auto mt-10 max-w-[1180px] px-3 sm:px-6 lg:px-8">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-[10px] font-semibold uppercase tracking-[.23em] text-sky-100/90">Journal / Air</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Articles & décryptages</h2></div>
      {editMode && <button onClick={()=>setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-cyan-100/25 bg-cyan-100/10 px-4 py-2 text-sm text-cyan-50"><FilePlus2 className="h-4 w-4"/>Nouvel article</button>}
    </div>
    {posts.length ? <div className="grid gap-5 md:grid-cols-2">
      {posts.map(post => { const photo=getNoteSharePhoto(post);const title=l(post.title)||"Sans titre";
        const excerpt=stripHtml(l(post.description)).replace(/\\[\\[MEDIA:[^\\]]+\\]\\]/g,"").replace(/\\s+/g," ").slice(0,170);
        return <article key={post.id} className="overflow-hidden rounded-2xl border border-white/45 bg-white/42 shadow-[0_12px_38px_-18px_rgba(8,44,85,0.35)] transition-colors hover:bg-white/52 backdrop-blur-2xl">
          <Link href={`/air/${post.id}`} className="group block">
            <div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-sky-100/70 to-sky-400/30">
              {photo ? <img src={photo} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <span className="flex h-full items-center justify-center text-7xl font-light text-sky-800/25">Air.</span>}
            </div>
            <div className="p-6"><p className="text-[10px] uppercase tracking-[.2em] text-sky-800/75">{post.date}</p><h3 className="mt-2 text-xl font-semibold text-slate-950">{title}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-800">{excerpt}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-sky-800">Lire l’article <ArrowUpRight className="h-4 w-4"/></span></div>
          </Link>
          {editMode && <div className="flex gap-2 border-t border-sky-900/10 px-5 py-3">
            <button className="inline-flex items-center gap-1 text-xs text-slate-800" onClick={()=>setEditing(post)}><Pencil className="h-3.5 w-3.5"/> Modifier</button>
            <button className="inline-flex items-center gap-1 text-xs text-red-700" onClick={()=>{if(window.confirm("Supprimer cet article AIR ?"))removeSocialPost(post.id)}}><Trash2 className="h-3.5 w-3.5"/> Supprimer</button>
          </div>}
        </article>;
      })}
    </div> : <div className="rounded-2xl border border-white/45 bg-white/40 p-10 text-center backdrop-blur-xl">
      <p className="text-[10px] uppercase tracking-[.2em] text-sky-800/75">À suivre</p>
      <h3 className="mt-3 text-xl text-slate-950">Les premiers articles prennent forme.</h3>
      <p className="mt-3 text-sm text-slate-800">Ici paraîtront mes décryptages, expériences et observations.</p>
    </div>}
    <Dialog open={createOpen || !!editing} onOpenChange={v=>{if(!v){setCreateOpen(false);setEditing(null)}}}>
      <DialogContent size="form" className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing?"Modifier un article AIR":"Nouvel article AIR"}</DialogTitle></DialogHeader>
      <SocialPostForm key={editing?.id ?? "new-air"} universe="air" initial={editing ?? undefined}
        onSubmit={publish} onCancel={()=>{setCreateOpen(false);setEditing(null)}} submitLabel={editing?"Enregistrer":"Publier"} />
      </DialogContent>
    </Dialog>
  </section>;
}
