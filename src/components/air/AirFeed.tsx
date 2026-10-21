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
      <div><p className="text-[10px] font-semibold uppercase tracking-[.23em] text-cyan-200/70">Journal / Air</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Articles & décryptages</h2></div>
      {editMode && <button onClick={()=>setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-cyan-100/25 bg-cyan-100/10 px-4 py-2 text-sm text-cyan-50"><FilePlus2 className="h-4 w-4"/>Nouvel article</button>}
    </div>
    {posts.length ? <div className="grid gap-5 md:grid-cols-2">
      {posts.map(post => { const photo=getNoteSharePhoto(post);const title=l(post.title)||"Sans titre";
        const excerpt=stripHtml(l(post.description)).replace(/\\[\\[MEDIA:[^\\]]+\\]\\]/g,"").replace(/\\s+/g," ").slice(0,170);
        return <article key={post.id} className="overflow-hidden rounded-2xl border border-white/15 bg-[#062532]/75 backdrop-blur-2xl">
          <Link href={`/air/${post.id}`} className="group block">
            <div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-sky-300/35 to-slate-950/70">
              {photo ? <img src={photo} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <span className="flex h-full items-center justify-center text-7xl font-light text-sky-100/25">Air.</span>}
            </div>
            <div className="p-6"><p className="text-[10px] uppercase tracking-[.2em] text-cyan-100/60">{post.date}</p><h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-300">{excerpt}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-xs text-cyan-100">Lire l’article <ArrowUpRight className="h-4 w-4"/></span></div>
          </Link>
          {editMode && <div className="flex gap-2 border-t border-white/10 px-5 py-3">
            <button className="inline-flex items-center gap-1 text-xs text-zinc-200" onClick={()=>setEditing(post)}><Pencil className="h-3.5 w-3.5"/> Modifier</button>
            <button className="inline-flex items-center gap-1 text-xs text-red-300" onClick={()=>{if(window.confirm("Supprimer cet article AIR ?"))removeSocialPost(post.id)}}><Trash2 className="h-3.5 w-3.5"/> Supprimer</button>
          </div>}
        </article>;
      })}
    </div> : <div className="rounded-2xl border border-white/15 bg-[#082532]/65 p-10 text-center backdrop-blur-xl">
      <p className="text-[10px] uppercase tracking-[.2em] text-cyan-200/75">À suivre</p>
      <h3 className="mt-3 text-xl text-white">Les premiers articles prennent forme.</h3>
      <p className="mt-3 text-sm text-zinc-300">Ici paraîtront mes décryptages, expériences et observations.</p>
    </div>}
    <Dialog open={createOpen || !!editing} onOpenChange={v=>{if(!v){setCreateOpen(false);setEditing(null)}}}>
      <DialogContent size="form" className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing?"Modifier un article AIR":"Nouvel article AIR"}</DialogTitle></DialogHeader>
      <SocialPostForm key={editing?.id ?? "new-air"} universe="air" initial={editing ?? undefined}
        onSubmit={publish} onCancel={()=>{setCreateOpen(false);setEditing(null)}} submitLabel={editing?"Enregistrer":"Publier"} />
      </DialogContent>
    </Dialog>
  </section>;
}
