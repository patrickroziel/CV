"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { MessageCircle, Send } from "lucide-react";

type Comment = { id: string; author_name: string; body: string; created_at: string };
export function PostComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [available, setAvailable] = useState(true);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(postId)}/comments`, { cache: "no-store" });
      const data = await response.json();
      setAvailable(Boolean(data.available));
      if (response.ok && Array.isArray(data.comments)) setComments(data.comments);
    } catch { setAvailable(false); }
  }, [postId]);

  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setNotice("");
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(postId)}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, comment, website }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Envoi impossible.");
      setName(""); setComment("");
      setNotice(data.message || "Merci ! Ton commentaire sera visible après validation.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Envoi impossible.");
    } finally { setBusy(false); }
  }

  return (
    <section className="mt-8 border-t border-white/10 pt-6" aria-labelledby="comments-title">
      <h2 id="comments-title" className="flex items-center gap-2 text-lg font-semibold text-white">
        <MessageCircle className="h-4 w-4 text-cyan-100" /> Commentaires <span className="text-sm font-normal text-zinc-500">({comments.length})</span>
      </h2>
      {comments.length > 0 ? <ol className="mt-4 space-y-4">
        {comments.map(item => <li key={item.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-zinc-100">{item.author_name}</p>
            <time className="text-[11px] text-zinc-500" dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</time>
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300">{item.body}</p>
        </li>)}
      </ol> : <p className="mt-3 text-sm text-zinc-500">Pas encore de commentaire publié.</p>}
      {available ? <form onSubmit={submit} className="mt-6 space-y-3">
        <p className="text-sm text-zinc-400">Ton commentaire sera soumis à validation avant d’apparaître ici.</p>
        <label className="block text-xs font-medium text-zinc-300">Ton nom
          <input required minLength={2} maxLength={60} value={name} onChange={e => setName(e.target.value)} autoComplete="name"
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-200/50" />
        </label>
        <label className="block text-xs font-medium text-zinc-300">Ton commentaire
          <textarea required minLength={3} maxLength={2000} rows={4} value={comment} onChange={e => setComment(e.target.value)}
            className="mt-1.5 w-full resize-y rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm leading-6 text-white outline-none focus:border-cyan-200/50" />
        </label>
        <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
          <label>Site web <input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} /></label>
        </div>
        <button type="submit" disabled={busy || !available} className="inline-flex items-center gap-2 rounded-full bg-cyan-200 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:opacity-50">
          <Send className="h-3.5 w-3.5" /> {busy ? "Envoi…" : "Envoyer le commentaire"}
        </button>
        {notice && <p role="status" className="text-sm text-cyan-100/90">{notice}</p>}
      </form> : <p className="mt-4 text-sm text-zinc-500">Les commentaires sont momentanément indisponibles.</p>}
    </section>
  );
}
