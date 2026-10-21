"use client";
import { useEffect, useState } from "react";
import { Heart, Share2 } from "lucide-react";

type ResponseState = { available?: boolean; count?: number; liked?: boolean };
export function PostActions({ postId, title, visible = true, sharePath = "/notes" }: { postId: string; title: string; visible?: boolean; sharePath?: "/notes" | "/air" }) {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    if (!visible) return;
    setReady(false);
    setEnabled(false);
    setCount(0);
    setLiked(false);
    fetch(`/api/notes/${encodeURIComponent(postId)}/likes`, { cache: "no-store" })
      .then(res => res.ok ? res.json() as Promise<ResponseState> : Promise.reject())
      .then(state => {
        if (!active) return;
        setEnabled(state.available === true);
        setCount(Math.max(0, Number(state.count) || 0));
        setLiked(state.liked === true);
        setReady(true);
      })
      .catch(() => { if (active) { setEnabled(false); setReady(true); } });
    return () => { active = false; };
  }, [postId, visible]);

  if (!visible) return null;
  async function react() {
    if (!enabled || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(postId)}/likes`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: !liked }),
      });
      if (!response.ok) throw new Error();
      const state = await response.json() as ResponseState;
      setLiked(state.liked === true); setCount(Number(state.count) || 0);
    } catch { setMessage("Like indisponible, réessaie plus tard."); }
    finally { setBusy(false); }
  }
  async function share() {
    // A fresh share URL avoids reusing X's potentially stale cached card.
    // The site still publishes the clean canonical /notes/[id] URL.
    const shared = new URL(`${sharePath}/${encodeURIComponent(postId)}`, "https://patrickroziel.com");
    shared.searchParams.set("share", Date.now().toString(36));
    const url = shared.toString();
    setMessage("");
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url });
      } else {
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
      <button type="button" disabled={!ready || !enabled || busy} onClick={() => void react()}
        aria-pressed={liked} title={!enabled ? "Likes indisponibles : vérifier la connexion Neon" : liked ? "Retirer mon like" : "J'aime"}
        className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm transition ${liked ? "bg-rose-400/10 text-rose-300" : "text-zinc-400 hover:bg-white/5 hover:text-rose-200"} disabled:cursor-not-allowed disabled:opacity-60`}>
        <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} aria-hidden />
        <span aria-label={ready && enabled ? `${count} likes` : "Likes temporairement indisponibles"}>{ready && enabled ? count.toLocaleString("fr-FR") : "—"}</span>
      </button>
      <button type="button" onClick={() => void share()}
        className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-cyan-100"
        aria-label={`Partager ${title || "la publication"}`}>
        <Share2 className="h-4 w-4" aria-hidden /> Partager
      </button>
    </div>
    {message && <span role="status" className="text-xs text-cyan-200">{message}</span>}
  </div>;
}
