"use client";
import { useState } from "react";
import { Heart, Share2 } from "lucide-react";

/** Share immediately. Community likes will activate with the private Neon database. */
export function PostActions({ postId, title, visible = true }: { postId: string; title: string; visible?: boolean }) {
  const [message, setMessage] = useState("");
  if (!visible) return null;
  async function share() {
    const url = new URL(`/notes/${encodeURIComponent(postId)}`, location.origin).toString();
    setMessage("");
    try {
      if (typeof navigator.share === "function") await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        setMessage("Lien copié !");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try { await navigator.clipboard.writeText(url); setMessage("Lien copié !"); }
      catch { setMessage("Impossible de copier le lien."); }
    }
  }
  return <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-white/[0.07] pt-3">
    <div className="flex items-center gap-3">
      <span title="Compteur de likes disponible après activation de la base de données" className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm text-zinc-500">
        <Heart className="h-4 w-4" aria-hidden /> <span aria-label="Likes non encore disponibles">—</span>
      </span>
      <button type="button" onClick={() => void share()}
        className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-cyan-100"
        aria-label={`Partager ${title || "la publication"}`}>
        <Share2 className="h-4 w-4" aria-hidden /> Partager
      </button>
    </div>
    {message && <span role="status" className="text-xs text-cyan-200">{message}</span>}
  </div>;
}
