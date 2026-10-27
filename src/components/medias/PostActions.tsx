"use client";
import { useEffect, useState } from "react";
import { Heart, Share2 } from "lucide-react";

type ResponseState = { available?: boolean; count?: number; liked?: boolean };
export function PostActions({ postId, title, visible = true, sharePath = "/notes", tone = "dark" }: {
  postId: string; title: string; visible?: boolean; sharePath?: "/notes" | "/air"; tone?: "dark" | "light";
}) {
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
    if (!enabled || busy) {
      if (!enabled) setMessage("Like indisponible pour le moment.");
      return;
    }
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
  const likeClass = tone === "light"
    ? "border-rose-700 bg-rose-600 text-white shadow-sm"
    : "border-rose-200/50 bg-rose-500 text-white shadow-[0_10px_24px_-14px_rgba(244,63,94,0.95)]";
  const shareClass = tone === "light"
    ? "border-sky-950 bg-sky-900 text-white shadow-sm"
    : "border-cyan-100/40 bg-cyan-300 text-slate-950";
  return <div className="flex min-w-0 flex-wrap items-center gap-2">
    <button type="button" onClick={() => void react()}
      aria-pressed={liked} title={liked ? "Retirer mon like" : "J'aime"}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition hover:brightness-110 ${likeClass} ${liked ? "ring-2 ring-white/70" : ""}`}>
      <Heart className="h-4 w-4 fill-current" aria-hidden />
      <span>J'aime</span>
      {ready && enabled ? <span className="tabular-nums">{count.toLocaleString("fr-FR")}</span> : null}
    </button>
    <button type="button" onClick={() => void share()}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition hover:brightness-110 ${shareClass}`}
      aria-label={`Partager ${title || "la publication"}`}>
      <Share2 className="h-4 w-4" aria-hidden /> Partager
    </button>
    {message && <span role="status" className={`w-full text-xs font-medium ${tone === "light" ? "text-sky-900" : "text-cyan-100"}`}>{message}</span>}
  </div>;
}
