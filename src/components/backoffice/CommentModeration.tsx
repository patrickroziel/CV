"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, RefreshCw, Trash2, X } from "lucide-react";

type Comment = { id: string; post_id: string; author_name: string; body: string; status: "pending" | "approved" | "rejected"; created_at: string };
const statusLabels = { pending: "À valider", approved: "Publié", rejected: "Refusé" };

export function CommentModeration({ backofficePath }: { backofficePath: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setMessage("");
    try {
      const response = await fetch("/api/backoffice/comments", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chargement impossible.");
      setComments(data.comments ?? []);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Chargement impossible."); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function act(item: Comment, action: "approve" | "reject" | "delete") {
    if (action === "delete" && !window.confirm("Supprimer définitivement ce commentaire ?")) return;
    setBusyId(item.id); setMessage("");
    try {
      const response = await fetch("/api/backoffice/comments", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Action impossible.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Action impossible."); }
    finally { setBusyId(""); }
  }

  const shown = comments.filter(item => filter === "all" || item.status === "pending");
  return <main className="relative z-20 mx-auto min-h-screen max-w-4xl px-4 pb-24 pt-28 text-white sm:px-6">
    <div className="rounded-3xl border border-cyan-200/20 bg-[#041820]/90 p-5 shadow-2xl backdrop-blur-2xl sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">Behind the Glass</p><h1 className="mt-2 text-2xl font-semibold">Modération des commentaires</h1><p className="mt-2 text-sm text-zinc-400">Aucun commentaire ne sera publié sans ton accord.</p></div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm"><RefreshCw className="h-4 w-4" /> Actualiser</button>
          <Link href={backofficePath} className="rounded-xl border border-white/15 px-3 py-2 text-sm">Retour</Link>
        </div>
      </div>
      <div className="mt-6 flex gap-2">
        <button onClick={() => setFilter("pending")} className={`rounded-full px-4 py-2 text-sm ${filter === "pending" ? "bg-cyan-200 text-slate-950" : "border border-white/15 text-zinc-300"}`}>À valider ({comments.filter(c => c.status === "pending").length})</button>
        <button onClick={() => setFilter("all")} className={`rounded-full px-4 py-2 text-sm ${filter === "all" ? "bg-cyan-200 text-slate-950" : "border border-white/15 text-zinc-300"}`}>Tous ({comments.length})</button>
      </div>
      {message && <p role="alert" className="mt-4 text-sm text-amber-200">{message}</p>}
      {shown.length === 0 ? <p className="mt-8 rounded-xl border border-white/10 p-6 text-sm text-zinc-400">{filter === "pending" ? "Aucun commentaire en attente. Tout est à jour." : "Aucun commentaire pour le moment."}</p> :
        <ul className="mt-5 space-y-3">{shown.map(item => <li key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="font-semibold">{item.author_name}</p><p className="mt-0.5 text-xs text-zinc-500">{new Date(item.created_at).toLocaleString("fr-FR")} · <span className={item.status === "pending" ? "text-amber-200" : "text-zinc-400"}>{statusLabels[item.status]}</span></p></div>
            <Link href={`/notes/${encodeURIComponent(item.post_id)}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-cyan-100 hover:underline">Voir le post <ExternalLink className="h-3 w-3" /></Link>
          </div>
          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-200">{item.body}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {item.status !== "approved" && <button disabled={busyId === item.id} onClick={() => void act(item, "approve")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-300 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Valider et publier</button>}
            {item.status === "pending" && <button disabled={busyId === item.id} onClick={() => void act(item, "reject")} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs disabled:opacity-50"><X className="h-3.5 w-3.5" /> Refuser</button>}
            <button disabled={busyId === item.id} onClick={() => void act(item, "delete")} className="inline-flex items-center gap-1.5 rounded-lg border border-red-300/20 px-3 py-2 text-xs text-red-200 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Supprimer</button>
          </div>
        </li>)}</ul>}
    </div>
  </main>;
}
